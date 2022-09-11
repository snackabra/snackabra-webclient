// note: modifications here and you need "yarn build" not just "yarn start"

// this allows us to set headers for local development (underlying 'express' server)
// https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually
// our primary need for this is enabling features like Shared Array Buffer:
// https://stackoverflow.com/questions/70455869/how-to-enable-sharedarraybuffer-in-microsoft-edge-javascript
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements

// you can verify if it's working properly by checking the "crossOriginIsolated" (global)
// property on the javascript console

module.exports = function(app) {
  app.use((req, res, next) => {
    res.set({
      'Snackabra-Info': 'Headers-Are-Set-In-setupProxy.js',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    });
      next();
  }); 
};
