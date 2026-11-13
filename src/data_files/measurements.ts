// Measurements shown on the home page. The full list lives in
// src/content/docs/docs/guides/example-measurements/tested-measurements/ (one page per measurement).
import type { ImageMetadata } from 'astro';
import geomagnetic from '@images/cw/geomagnetic.jpg';
import m_angular from '@images/cw/m-angular.jpg';
import m_southpole from '@images/cw/m-southpole.jpg';
import m_subway from '@images/cw/m-subway.jpg';
import m_velocity from '@images/cw/m-velocity.jpg';
import render_pair from '@images/cw/render-pair.png';

export interface Measurement {
  url: string;
  title: string;
  summary: string;
  image: ImageMetadata;
  alt: string;
}

export const featuredMeasurements: Measurement[] = [
  {
    url: '/docs/guides/example-measurements/tested-measurements/a-full-sky-cosmic-ray-muon-measurement/',
    title: 'A Full-Sky Muon Rate Measurement',
    summary:
      'The SiPM pulse-height spectrum exhibits the characteristic Landau-shaped “minimum ionizing particle (MIP) bump” produced by through-going muons in a thin absorber.',
    image: render_pair,
    alt: 'Two v3X detectors stacked on top of each other in coincidence mode',
  },
  {
    url: '/docs/guides/example-measurements/tested-measurements/cosmic-ray-muon-angular-dependence/',
    title: 'How the Muon Rate Depends on Angle',
    summary:
      'The angular dependence of cosmic-ray muons at sea level follows a cosine-squared law.',
    image: m_angular,
    alt: 'Two detectors mounted on a bar leaning against a wall at angle theta',
  },
  {
    url: '/docs/guides/example-measurements/tested-measurements/muon-rate-measurement-while-flying-to-the-south-pole/',
    title: 'Muon Rate on a Flight to the South Pole',
    summary:
      'During the flight to the South Pole, the ionizing radiation was measured with two detectors, powered through a single 30,000 mAh power bank.',
    image: m_southpole,
    alt: 'Measured muon rate on each leg of a flight from Wisconsin to the South Pole',
  },
  {
    url: '/docs/guides/example-measurements/tested-measurements/latitude-correction-to-the-cosmic-ray-muons/',
    title: 'Correcting the Rate for Latitude and Altitude',
    summary:
      'Latitudinal variation in the cosmic-ray muon rate is an expected effect due to the change in the Earth’s magnetic field as a function of latitude.',
    image: geomagnetic,
    alt: "Diagram of charged particles moving in Earth's magnetic field",
  },
  {
    url: '/docs/guides/example-measurements/tested-measurements/cosmic-ray-muon-velocity/',
    title: 'Measuring the Speed of Muons',
    summary:
      'Time-of-flight (TOF) measurements to estimate the cosmic-ray muon velocities, with two detectors vertically separated by 2.97 m.',
    image: m_velocity,
    alt: 'Histogram of measured muon speeds with a Gaussian fit centered near 0.92c',
  },
  {
    url: '/docs/guides/example-measurements/tested-measurements/cosmic-ray-muon-attenuation-in-a-subway-station/',
    title: 'Muon Attenuation in a Subway Station',
    summary:
      'The Aobayama subway station was extremely deep underground, and the muon attenuation was found to be surprisingly pronounced.',
    image: m_subway,
    alt: 'Muon rate measured in an office, two deep subway stations and at ground level in Sendai, Japan',
  },
];
