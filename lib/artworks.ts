import data from "@/data/artworks.json";

export type Artwork = {
  slug: string;
  title: string;
  year: number;
  technique: string;
  dimensions: string;
  signed: string;
  priceClp: number;
  priceUsd: number;
  status: "available" | "sold" | "reserved";
  edition: string;
  image: string;
  description: string;
  inquiryRecommended?: boolean;
};

export type Artist = {
  name: string;
  fullName: string;
  city: string;
  bio: string;
  ens: string;
  email: string;
  instagram: string;
};

export const artist: Artist = data.artist;
export const artworks: Artwork[] = data.artworks as Artwork[];

export function getArtwork(slug: string): Artwork | undefined {
  return artworks.find((a) => a.slug === slug);
}

export function formatClp(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
