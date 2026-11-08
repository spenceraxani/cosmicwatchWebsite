// Measurements shown on the home page. The full list lives in
// src/content/docs/docs/measurements/ (one page per measurement).
import type { ImageMetadata } from 'astro';
import geomagnetic from '@images/cw/geomagnetic.jpg';
import m_angular from '@images/cw/m-angular.jpg';
import m_southpole from '@images/cw/m-southpole.jpg';
import m_subway from '@images/cw/m-subway.jpg';
import m_velocity from '@images/cw/m-velocity.jpg';
import render_pair from '@images/cw/render-pair.png';

export interface Measurement {
  slug: string;
  title: string;
  summary: string;
  image: ImageMetadata;
  alt: string;
}

export const featuredMeasurements: Measurement[] = [
  {
    slug: 'full-sky-rate',
    title: "A full-sky muon rate measurement",
    summary: "Stack two detectors, log for a day, and separate muons from background by pulse height.",
    image: render_pair,
    alt: "Two v3X detectors stacked on top of each other in coincidence mode",
  },
  {
    slug: 'angular-dependence',
    title: "How the muon rate depends on angle",
    summary: "Tilt a coincidence pair and watch the rate follow the cos² law.",
    image: m_angular,
    alt: "Two detectors mounted on a bar leaning against a wall at angle theta",
  },
  {
    slug: 'flight-to-the-south-pole',
    title: "Muon rate on a flight to the South Pole",
    summary: "Six flights, one power bank, and a clear latitude effect.",
    image: m_southpole,
    alt: "Measured muon rate on each leg of a flight from Wisconsin to the South Pole",
  },
  {
    slug: 'latitude-correction',
    title: "Correcting the rate for latitude and altitude",
    summary: "Fit a simple model to flight data, then use it to estimate altitude.",
    image: geomagnetic,
    alt: "Diagram of charged particles moving in Earth's magnetic field",
  },
  {
    slug: 'muon-velocity',
    title: "Measuring the speed of muons",
    summary: "Time-of-flight between two detectors three meters apart.",
    image: m_velocity,
    alt: "Histogram of measured muon speeds with a Gaussian fit centered near 0.92c",
  },
  {
    slug: 'subway-attenuation',
    title: "Muon attenuation in a subway station",
    summary: "Take a detector underground and watch the rate drop.",
    image: m_subway,
    alt: "Muon rate measured in an office, two deep subway stations and at ground level in Sendai, Japan",
  },
];
