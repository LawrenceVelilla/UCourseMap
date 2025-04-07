
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing Next.js config options might be here
  reactStrictMode: true,
  // ... other options like experimental features, redirects, etc.

  // Add the webpack config for SVGR
  webpack(config, { isServer }) { // Added { isServer } for context if needed later
    // Find the default rule that handles SVG files (usually using file-loader or asset modules)
    // @ts-ignore - rule.test may be unknown type
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );

    config.module.rules.push(
      // Rule #1: Handle *.svg?url imports (as standard asset module)
      // Allows importing SVG as a URL string if needed explicitly
       {
         test: /\.svg$/i,
         type: 'asset/resource', // Use asset module type
         resourceQuery: /url/, // *.svg?url
       },
      // Rule #2: Handle standard *.svg imports (as React components)
      // Applies to imports NOT ending in ?url
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule?.issuer, // Use the same issuer context if possible
        resourceQuery: { not: [...(fileLoaderRule?.resourceQuery?.not || []), /url/] }, // Exclude if ?url is present
        use: [{
            loader: '@svgr/webpack',
            options: {
                typescript: true,        // Output TSX components
                icon: true,              // Use viewBox for scalable icons
                // Optionally remove width/height attributes relies on viewBox/CSS for size
                // dimensions: false,
                svgoConfig: {            // Optimize SVG output
                    plugins: [
                        {
                            name: 'preset-default',
                            params: { overrides: { removeViewBox: false } } // Keep viewBox for scaling
                        },
                        // Optional: enable more SVGO plugins if needed
                        // 'prefixIds', // Example if ID conflicts occur
                    ]
                }
            }
        }],
      }
    );

    // Modify the original SVG rule created by Next.js to exclude SVG files
    // handled by SVGR rule above
    if (fileLoaderRule) {
        // @ts-ignore - exclude may be unknown type
      fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

// Use export default for .mjs files
export default nextConfig;