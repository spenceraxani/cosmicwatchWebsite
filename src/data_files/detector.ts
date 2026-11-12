/** v2 vs v3X specifications, from Table 1 of the v3X paper (arXiv:2508.12111). */
export const specs: [string, string, string][] = [
  ['Processor', 'ATmega328P, single core, 16 MHz', 'Cortex-M0+ (RP2040), dual core, 133 MHz'],
  ['Memory', '32 KB flash, 2 KB RAM', '2 MB flash, 264 KB RAM'],
  ['ADC resolution', 'under 8-bit', '12-bit'],
  ['Maximum event rate', '15 Hz', '700 Hz'],
  ['Dead time per event', '50 ms', '400 µs'],
  ['Noise', '0.5 mV RMS', '0.1 mV RMS'],
  ['Minimum trigger threshold', '12 mV', '4 mV'],
  ['Accidental coincidence rate', '4.5 × 10⁻⁴ Hz', '4.5 × 10⁻⁵ Hz'],
  ['Sensors', 'Temperature', 'Temperature, pressure, accelerometer, gyroscope'],
  ['Display and logging', 'OLED or microSD', 'OLED and microSD, plus buzzer'],
  ['Power', '0.27 W', '0.5 W'],
  ['Weight in case', '106 g', '110 g'],
  ['Scintillator / effective area', '5 × 5 × 1 cm, 25 cm²', '5 × 5 × 1 cm, 25 cm²'],
  ['Parts cost', 'about $100', 'about $100'],
];

/** Component list for the Detector page, in the style of the original site's "Components" tab.
 *  Facts from the v3X paper (JINST 20 P10040, arXiv:2508.12111), sections 1.2–2.2. */
export const parts: { name: string; detail: string }[] = [
  { name: 'Plastic scintillator', detail: '5 × 5 × 1 cm slab, the detection medium; about 10,000 photons per MeV' },
  { name: 'Silicon photomultiplier', detail: 'onsemi MicroFC-60035 for light collection: 6 × 6 mm, biased at 30 V, about 43% efficient at 420 nm' },
  { name: 'Raspberry Pi Pico', detail: 'Dual-core RP2040 at 133 MHz: one core takes data, the other runs the screen, card and sensors' },
  { name: 'Analog front end', detail: '13.5× amplifier, peak detector and comparator; trigger threshold down to 4 mV' },
  { name: '0.96" OLED screen', detail: 'Run time, counts and dead-time-corrected rate, updated in real time' },
  { name: 'BMP280 sensor', detail: 'Temperature and barometric pressure' },
  { name: 'MPU-6050', detail: 'Accelerometer and gyroscope for orientation and motion' },
  { name: 'microSD socket', detail: 'A new plain-text file every time the detector starts' },
  { name: 'RJ45 port', detail: 'Links two detectors over a CAT5/6 cable for coincidence mode, and carries power' },
  { name: 'BNC connector', detail: 'The raw SiPM pulse for an oscilloscope, with nanosecond timing' },
];
