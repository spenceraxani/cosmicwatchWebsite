"""Build the sample data the site ships from a real CosmicWatch v3X run.

  python scripts/make-sample-data.py <path-to>/Data/ExampleData/AxLab_C_001.txt

Writes:
  public/data/axlab-sample-12h.txt.gz   first 12 hours, unchanged format, for the Measure page
  src/data_files/real-run.json          hourly summary of the whole run, for the home page chart
"""
import gzip, json, math, sys
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

# 2. hourly summary of the full run
BIN = 3600.0
bins = {}
adc_all = [0] * 64
adc_coinc = [0] * 64
for l in data:
    c = l.split('\t')
    t = float(c[1]); flag = c[2] == '1'; adc = int(c[3])
    b = bins.setdefault(int(t // BIN), {'n': 0, 'c': 0, 'temp': 0.0, 'press': 0.0})
    b['n'] += 1; b['c'] += flag
    b['temp'] += float(c[6]); b['press'] += float(c[7])
    k = min(63, adc // 64)
    adc_all[k] += 1
    if flag: adc_coinc[k] += 1
duration = float(data[-1].split('\t')[1])
full = [k for k in sorted(bins) if (k + 1) * BIN <= duration]
summary = {
    'detector': 'AxLab',
    'source': 'Data/ExampleData/AxLab_C_001.txt in the CosmicWatch v3X repository',
    'durationHours': round(duration / 3600, 2),
    'events': len(data),
    'binSeconds': BIN,
    'hours': [
        {
            'h': k,
            'rate': round(bins[k]['n'] / BIN, 4),
            'coincRate': round(bins[k]['c'] / BIN, 4),
            'tempC': round(bins[k]['temp'] / bins[k]['n'], 2),
            'pressureHPa': round(bins[k]['press'] / bins[k]['n'] / 100, 2),
        }
        for k in full
    ],
    'adcBinWidth': 64,
    'adcAll': adc_all,
    'adcCoincident': adc_coinc,
}
(root / 'src/data_files/real-run.json').write_text(json.dumps(summary) + '\n')
print(len(excerpt), 'events in excerpt;', len(full), 'hourly bins')
