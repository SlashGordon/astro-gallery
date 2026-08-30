import { defineConfig } from 'astro/config';
import gallery from 'astro-gallery';

// https://astro.build/config
export default defineConfig({
  // `site` lets the components emit absolute URLs in their JSON-LD structured data.
  site: 'https://astro-gallery.example',
  integrations: [
    gallery({
      locale: 'en-GB',
      // The demo's synthetic photos use a made-up camera; nothing to geocode
      // against the network on CI because demo/.cache/... is committed... except
      // it isn't in this repo, so keep lookups on but expect them to no-op
      // offline (labels just come back empty).
      geocode: { enabled: true, userAgent: 'astro-gallery-demo (local)' },
      map: {
        // Default is the keyless "osm" basemap. Other presets:
        //   basemap: 'carto-dark' | 'carto-light' | 'carto-voyager' | 'stadia-dark'
        //   tileApiKey: process.env.CARTO_API_KEY,   // those presets need a key
        //   basemap: 'esri-satellite'                // keyless, forces dark chrome
        consentTitle: 'Show the photo map?',
        consentText:
          'The map loads tiles from <strong>OpenStreetMap</strong>. Your IP address is sent to that provider. See the <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer">OSMF privacy policy</a>.',
        consentButtonLabel: 'Load the map',
      },
    }),
  ],
});
