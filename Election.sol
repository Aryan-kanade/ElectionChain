// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * ElectionChain Smart Contract
 * Deploy on Ganache (local) or any EVM-compatible network
 * Features:
 *  - Multi-admin approval system (Fix 7)
 *  - Immutable vote recording (Fix 1)
 *  - Candidate management with approval voting
 *  - Auto election timing (on-chain timestamps)
 *  - Full audit trail via events
 */
contract ElectionChain {

    // ── STRUCTS ──────────────────────────────────────────────────
    struct Candidate {
        uint256 id;
        string  name;
        string  party;
        bool    approved;   // needs multi-admin approval
        uint256 voteCount;
        bool    exists;
    }

    struct Voter {
        bool registered;
        bool hasVoted;
        uint256 votedCandidateId;
        bytes32 faceHash;       // SHA-256 of face descriptor
        bytes32 emailHash;      // SHA-256 of email
        uint256 registeredAt;
    }

    struct AdminProposal {
        address proposedAdmin;
        uint256 approvals;
        bool    executed;
        mapping(address => bool) hasApproved;
    }

    struct ResultProposal {
        uint256 approvals;
        bool    executed;
        mapping(address => bool) hasApproved;
    }

    // ── STATE ─────────────────────────────────────────────────────
    address public owner;
    address[] public admins;
    mapping(address => bool) public isAdmin;
    uint256 public adminCount;
    uint256 public requiredApprovals; // multi-admin threshold

    mapping(uint256 => Candidate) public candidates;
    uint256 public candidateCount;

    mapping(address => Voter) public voters;
    uint256 public voterCount;
    uint256 public totalVotesCast;

    uint256 public electionStart;
    uint256 public electionEnd;
    bool    public resultsDeclared;
    bool    public electionLocked; // locked after first vote

    uint256 public proposalCount;
    mapping(uint256 => AdminProposal) public adminProposals;

    ResultProposal public resultProposal;

    // ── EVENTS (Audit Trail - Fix 1 & Fix 6) ─────────────────────
    event VoteCast(
        address indexed voter,
        uint256 indexed candidateId,
        bytes32 voteHash,
        uint256 timestamp
    );
    event VoterRegistered(
        address indexed voter,
        bytes32 faceHash,
        uint256 timestamp
    );
    event CandidateAdded(
        uint256 indexed id,
        string name,
        string party,
        address indexed addedBy
    );
    event CandidateApproved(
        uint256 indexed id,
        address indexed approvedBy
    );
    event ElectionStartSet(uint256 start, uint256 end, address indexed by);
    event ResultsDeclared(uint256 winnerId, uint256 winnerVotes, uint256 timestamp);
    event AdminProposed(uint256 indexed proposalId, address indexed proposed, address indexed proposer);
    event AdminApproved(uint256 indexed proposalId, address indexed approver);
    event AdminAdded(address indexed newAdmin);
    event ResultProposalCreated(address indexed proposer);
    event ResultProposalApproved(address indexed approver, uint256 approvals);

    // ── MODIFIERS ─────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admin");
        _;
    }
    modifier electionActive() {
        require(block.timestamp >= electionStart, "Election not started");
        require(block.timestamp <= electionEnd,   "Election ended");
        require(!resultsDeclared,                 "Results declared");
        _;
    }

    // ── CONSTRUCTOR ───────────────────────────────────────────────
    constructor(uint256 _requiredApprovals) {
        owner = msg.sender;
        admins.push(msg.sender);
        isAdmin[msg.sender] = true;
        adminCount = 1;
        requiredApprovals = _requiredApprovals > 0 ? _requiredApprovals : 1;
    }

    // ── FIX 7: MULTI-ADMIN SYSTEM ─────────────────────────────────
    function proposeAdmin(address _newAdmin) external onlyAdmin returns (uint256) {
        require(!isAdmin[_newAdmin], "Already admin");
        uint256 pid = proposalCount++;
        adminProposals[pid].proposedAdmin = _newAdmin;
        adminProposals[pid].approvals = 1;
        adminProposals[pid].hasApproved[msg.sender] = true;
        emit AdminProposed(pid, _newAdmin, msg.sender);
        if (adminProposals[pid].approvals >= requiredApprovals) {
            _executeAdminProposal(pid);
        }
        return pid;
    }

    function approveAdminProposal(uint256 _pid) external onlyAdmin {
        AdminProposal storage p = adminProposals[_pid];
        require(!p.executed, "Already executed");
        require(!p.hasApproved[msg.sender], "Already approved");
        p.hasApproved[msg.sender] = true;
        p.approvals++;
        emit AdminApproved(_pid, msg.sender);
        if (p.approvals >= requiredApprovals) {
            _executeAdminProposal(_pid);
        }
    }

    function _executeAdminProposal(uint256 _pid) internal {
        AdminProposal storage p = adminProposals[_pid];
        p.executed = true;
        address newAdmin = p.proposedAdmin;
        admins.push(newAdmin);
        isAdmin[newAdmin] = true;
        adminCount++;
        emit AdminAdded(newAdmin);
    }

    // FIX 7: Multi-admin result declaration
    function proposeResults() external onlyAdmin {
        require(!resultsDeclared, "Already declared");
        require(!resultProposal.executed, "Already proposed");
        require(!resultProposal.hasApproved[msg.sender], "Already approved");
        resultProposal.hasApproved[msg.sender] = true;
        resultProposal.approvals++;
        emit ResultProposalCreated(msg.sender);
        emit ResultProposalApproved(msg.sender, resultProposal.approvals);
        if (resultProposal.approvals >= requiredApprovals) {
            _declareResults();
        }
    }

    function _declareResults() internal {
        resultProposal.executed = true;
        resultsDeclared = true;
        uint256 winnerId = _getWinnerId();
        emit ResultsDeclared(winnerId, candidates[winnerId].voteCount, block.timestamp);
    }

    function _getWinnerId() internal view returns (uint256) {
        uint256 maxVotes = 0;
        uint256 winnerId = 0;
        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerId = i;
            }
        }
        return winnerId;
    }

    // ── FIX 1: CANDIDATE MANAGEMENT ──────────────────────────────
    function addCandidate(string memory _name, string memory _party) external onlyAdmin {
        require(!electionLocked, "Election locked — cannot add candidates after voting starts");
        candidateCount++;
        candidates[candidateCount] = Candidate({
            id:        candidateCount,
            name:      _name,
            party:     _party,
            approved:  adminCount == 1, // auto-approve if single admin
            voteCount: 0,
            exists:    true
        });
        emit CandidateAdded(candidateCount, _name, _party, msg.sender);
    }

    function approveCandidate(uint256 _id) external onlyAdmin {
        require(candidates[_id].exists, "Candidate not found");
        candidates[_id].approved = true;
        emit CandidateApproved(_id, msg.sender);
    }

    // ── FIX 1: ELECTION TIMING ────────────────────────────────────
    function setElectionTimes(uint256 _start, uint256 _end) external onlyAdmin {
        require(_start < _end, "Start must be before end");
        require(_end > block.timestamp, "End must be in future");
        require(!electionLocked, "Cannot change times after voting starts");
        electionStart = _start;
        electionEnd   = _end;
        emit ElectionStartSet(_start, _end, msg.sender);
    }

    // ── FIX 2: VOTER REGISTRATION (stores hashes) ─────────────────
    function registerVoter(
        address _voter,
        bytes32 _faceHash,
        bytes32 _emailHash
    ) external onlyAdmin {
        require(!voters[_voter].registered, "Already registered");
        voters[_voter] = Voter({
            registered:        true,
            hasVoted:          false,
            votedCandidateId:  0,
            faceHash:          _faceHash,
            emailHash:         _emailHash,
            registeredAt:      block.timestamp
        });
        voterCount++;
        emit VoterRegistered(_voter, _faceHash, block.timestamp);
    }

    // ── FIX 1: CAST VOTE (immutable, on-chain) ────────────────────
    function castVote(uint256 _candidateId) external electionActive {
        Voter storage v = voters[msg.sender];
        require(v.registered,            "Voter not registered");
        require(!v.hasVoted,             "Already voted");
        require(candidates[_candidateId].exists,   "Candidate not found");
        require(candidates[_candidateId].approved, "Candidate not approved");

        if (!electionLocked) electionLocked = true;

        v.hasVoted          = true;
        v.votedCandidateId  = _candidateId;
        candidates[_candidateId].voteCount++;
        totalVotesCast++;

        bytes32 voteHash = keccak256(abi.encodePacked(msg.sender, _candidateId, block.timestamp));
        emit VoteCast(msg.sender, _candidateId, voteHash, block.timestamp);
    }

    // ── VIEWS ─────────────────────────────────────────────────────
    function getCandidate(uint256 _id) external view returns (
        uint256 id, string memory name, string memory party,
        bool approved, uint256 voteCount
    ) {
        Candidate storage c = candidates[_id];
        return (c.id, c.name, c.party, c.approved, c.voteCount);
    }

    function getVoter(address _addr) external view returns (
        bool registered, bool hasVoted, uint256 votedCandidateId
    ) {
        Voter storage v = voters[_addr];
        return (v.registered, v.hasVoted, v.votedCandidateId);
    }

    function getElectionStatus() external view returns (
        bool active, bool ended, bool declared,
        uint256 start, uint256 end, uint256 totalVotes
    ) {
        return (
            block.timestamp >= electionStart && block.timestamp <= electionEnd && !resultsDeclared,
            block.timestamp > electionEnd,
            resultsDeclared,
            electionStart,
            electionEnd,
            totalVotesCast
        );
    }

    function getResultProposalStatus() external view returns (
        uint256 approvals, uint256 required, bool executed
    ) {
        return (resultProposal.approvals, requiredApprovals, resultProposal.executed);
    }

    function getAllCandidates() external view returns (
        uint256[] memory ids,
        string[] memory names,
        string[] memory parties,
        bool[] memory approved,
        uint256[] memory voteCounts
    ) {
        ids       = new uint256[](candidateCount);
        names     = new string[](candidateCount);
        parties   = new string[](candidateCount);
        approved  = new bool[](candidateCount);
        voteCounts = new uint256[](candidateCount);
        for (uint256 i = 0; i < candidateCount; i++) {
            Candidate storage c = candidates[i + 1];
            ids[i]        = c.id;
            names[i]      = c.name;
            parties[i]    = c.party;
            approved[i]   = c.approved;
            voteCounts[i] = c.voteCount;
        }
    }
}
