import re

with open('app.py', 'r') as f:
    content = f.read()

# Replace contamination
content = content.replace('contamination=0.1', 'contamination=0.3')

# Replace TRAIN_DATA block entirely
new_data = '''TRAIN_DATA = np.array([
    [  300,      1,        1,       1  ],
    [  450,      1,        1,       2  ],
    [  600,      1,        2,       3  ],
    [  500,      1,        1,       1  ],
    [  800,      1,        1,       2  ],
    [  350,      1,        1,       1  ],
    [  700,      1,        2,       3  ],
    [  400,      1,        1,       1  ],
    [  550,      1,        1,       2  ],
    [  900,      1,        1,       1  ],
    [  420,      1,        1,       1  ],
    [  480,      1,        1,       2  ],
    [  620,      1,        1,       2  ],
    [  750,      1,        2,       3  ],
    [  310,      1,        1,       1  ],
    [  660,      1,        1,       2  ],
    [  580,      1,        2,       2  ],
    [  440,      1,        1,       1  ],
    [  720,      1,        1,       3  ],
    [  390,      1,        1,       1  ],
    [    2,      9,       50,      80  ],
    [    1,     10,      100,     200  ],
    [    5,      8,       75,      90  ],
    [    3,      7,       60,     100  ],
    [    4,     12,       80,     150  ],
    [   10,      6,       40,      70  ],
    [    1,     15,      200,     300  ],
    [    6,      9,       55,      95  ],
    [    2,     11,       90,     120  ],
    [    8,      7,       45,      85  ],
])'''

content = re.sub(r'TRAIN_DATA = np\.array\(\[.*?\]\)', new_data, content, flags=re.DOTALL)

with open('app.py', 'w') as f:
    f.write(content)

print("Done! 30 samples, contamination=0.3")
