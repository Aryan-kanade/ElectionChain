/**
 * controllers/auth.controller.js
 */

const { User, OTP }    = require('../models');
const { sendOTPEmail } = require('../config/mailer');
const { state, sendTx } = require('../config/blockchain');
const { signToken, signFaceToken } = require('../middleware/auth.middleware');
const { logAudit }     = require('../services/audit.service');
const { sha256, genOTP, compareFaceDescriptors } = require('../crypto');

exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existing  = await OTP.findOne({ email });
    if (existing && existing.expiry > new Date() && existing.attempts >= 3)
      return res.status(429).json({ success: false, error: 'Too many attempts. Wait before requesting a new OTP.' });

    const otp = genOTP();
    await OTP.findOneAndUpdate(
      { email },
      { otpHash: sha256(otp), expiry: new Date(Date.now() + 10 * 60 * 1000), verified: false, attempts: 0 },
      { upsert: true, new: true }
    );

    const info = await sendOTPEmail(email, otp);
    console.log(`OTP dispatched → ${email} (${info.messageId})`);

    res.json({
      success: true,
      message: 'OTP sent to your email.',
      ...(process.env.NODE_ENV !== 'production' && { devOTP: otp }),
    });
  } catch (e) { next(e); }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const rec = await OTP.findOne({ email });
    if (!rec)                    return res.status(400).json({ success: false, error: 'No OTP found for this email.' });
    if (new Date() > rec.expiry) return res.status(400).json({ success: false, error: 'OTP expired. Request a new one.' });
    if (rec.verified)            return res.status(400).json({ success: false, error: 'OTP already used.' });

    rec.attempts += 1;
    if (rec.attempts > 5) { await rec.save(); return res.status(429).json({ success: false, error: 'Too many incorrect attempts. Request a new OTP.' }); }
    if (rec.otpHash !== sha256(otp)) { await rec.save(); return res.status(400).json({ success: false, error: 'Incorrect OTP.' }); }

    rec.verified = true;
    await rec.save();
    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (e) { next(e); }
};

exports.register = async (req, res, next) => {
  try {
    const { address, name, email, faceDescriptor, photoUrl } = req.body;

    const otpRec = await OTP.findOne({ email });
    if (!otpRec?.verified)
      return res.status(400).json({ success: false, error: 'Email not verified. Complete OTP verification first.' });

    const clash = await User.findOne({ $or: [{ address }, { email }] });
    if (clash?.address === address) return res.status(409).json({ success: false, error: 'Wallet address already registered.' });
    if (clash?.email   === email)   return res.status(409).json({ success: false, error: 'Email already registered.' });

    const descriptor = Array.isArray(faceDescriptor) ? faceDescriptor : Object.values(faceDescriptor);
    const faceHash   = sha256(JSON.stringify(descriptor));
    const emailHash  = sha256(email);

    const user = await User.create({ address, name, email, faceHash, emailHash, faceDescriptor: descriptor, photoUrl: photoUrl || '', role: 'voter' });

    if (state.blockchainConnected && state.contract) {
      try { await sendTx(state.contract.methods.registerVoter(address, '0x' + faceHash, '0x' + emailHash), { gas: 200000 }); }
      catch (e) { console.warn('BC registerVoter failed (DB saved):', e.message); }
    }

    await logAudit({ action: 'VOTER_REGISTERED', address, data: { name, emailHash } });
    res.status(201).json({ success: true, token: signToken(address, 'voter'), user: { address, name, role: 'voter' } });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { address, role } = req.body;
    const ADMIN = (process.env.ADMIN_ADDRESS || '').toLowerCase();

    if (role === 'admin') {
      if (!ADMIN || address !== ADMIN)
        return res.status(403).json({ success: false, error: 'Not an authorised admin address.' });
      return res.json({ success: true, token: signToken(address, 'admin'), user: { address, name: 'Administrator', role: 'admin' } });
    }

    const user = await User.findOne({ address });
    if (!user) return res.status(404).json({ success: false, error: 'Address not registered. Please register first.' });
    res.json({ success: true, token: signToken(address, 'voter'), user: { address, name: user.name, role: 'voter' } });
  } catch (e) { next(e); }
};

exports.verifyFace = async (req, res, next) => {
  try {
    const { currentDescriptor, scanScores } = req.body;
    const user = await User.findOne({ address: req.user.address });
    if (!user)                        return res.status(404).json({ success: false, error: 'User not found.' });
    if (!user.faceDescriptor?.length) return res.status(400).json({ success: false, error: 'No face enrolled for this account.' });

    const current = Array.isArray(currentDescriptor) ? currentDescriptor : Object.values(currentDescriptor);
    const { distance, matchScore, passed } = compareFaceDescriptors(user.faceDescriptor, current);
    const passedScans = scanScores ? scanScores.filter(s => s <= 0.52).length : (passed ? 3 : 0);

    await logAudit({ action: passed ? 'FACE_VERIFY_PASS' : 'FACE_VERIFY_FAIL', address: req.user.address, data: { distance: distance.toFixed(4), matchScore, passedScans } });

    if (!passed || passedScans < 2)
      return res.status(401).json({ success: false, error: `Face verification failed. Score: ${matchScore}%. Scans passed: ${passedScans}/3.`, matchScore, passedScans });

    res.json({ success: true, matchScore, passedScans, faceToken: signFaceToken(req.user.address) });
  } catch (e) { next(e); }
};
