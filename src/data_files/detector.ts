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

export const parts: { name: string; detail: string }[] = [
  { name: 'Plastic scintillator', detail: '5 × 5 × 1 cm' },
  { name: 'Silicon photomultiplier', detail: 'onsemi MicroFC-60035, 6 × 6 mm active area' },
  { name: 'Raspberry Pi Pico', detail: 'RP2040 microcontroller; a Pico W adds WiFi' },
  { name: 'Analog front end', detail: 'Amplifier, peak detector and comparator for a hardware trigger' },
  { name: '0.96" OLED screen', detail: 'Run time, counts, rates and file name' },
  { name: 'BMP280 sensor', detail: 'Temperature and barometric pressure' },
  { name: 'Accelerometer and gyroscope', detail: 'Orientation and motion on three axes' },
  { name: 'microSD socket', detail: 'Logs every event as plain text' },
  { name: 'RJ45 port', detail: 'Links two detectors for coincidence mode' },
  { name: 'BNC connector', detail: 'Raw SiPM signal for an oscilloscope' },
];
