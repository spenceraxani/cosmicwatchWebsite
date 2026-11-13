"""Build the sample data the site ships from a real CosmicWatch v3X run.

  python scripts/make-sample-data.py <path-to>/Data/ExampleData/AxLab_C_001.txt

Writes:
  public/data/axlab-sample-12h.txt.gz   first 12 hours, unchanged format, for the Measure page
"""
import gzip, sys
from pathlib import Path

src = Path(sys.argv[1])
root = Path(__file__).resolve().parent.parent
lines = src.read_text().split('\n')
header = [l for l in lines[:12] if l.startswith('#')]
data = [l for l in lines if l and not l.startswith('#')]

# 1. 12-hour excerpt, byte-for-byte the detector's own format
cut = 12 * 3600
excerpt = [l for l in data if float(l.split('\t')[1]) < cut]
with gzip.open(root / 'public/data/axlab-sample-12h.txt.gz', 'wt', compresslevel=9) as f:
    f.write('\n'.join(header + excerpt) + '\n')

print(len(excerpt), 'events in the 12-hour excerpt')
