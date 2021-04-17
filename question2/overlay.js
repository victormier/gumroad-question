(function () {
  function convertStyles(styles = {}) {
    return Object.entries(styles).map(([property, value]) => `${property}:${value}`).join(';');
  }

  class GumroadLink {
    constructor(element, productPermalink, widget) {
      this.element = element;
      this.productPermalink = productPermalink;
      this.widget = widget;
      this.prefetchLink = null;
      this.init();
    }

    init() {
      this.element.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.widget.setActiveLink(this);
      };
      this.element.addEventListener('mouseenter', () => {
        this.widget.prefetchLink(this);
      });
    }
  }

  class GumroadWidget {
    constructor() {
      this.links = [];
      this.acceptedUrlSchemas = ['gum.co', 'gumroad.com/l'];
      this.activeLink = null;
      this.init();
    }

    init() {
      this.setStyles();
      this.setUrlSchemas();
      this.constructSelectorRegexp();
      this.createOverlayContainer();
      this.createIframe();
      this.setMessaging();
      this.setupKeyListener();
      this.parseLinks();
      this.setupNewNodeObserver();
    }

    setStyles() {
      const style = document.createElement('style');
      style.innerHTML = `
        .gumroad-overlay {
          position: fixed;
          left: 0;
          top: 0;
          z-index: 99999;
          overflow-y: auto;
        }
        .gumroad-overlay__iframe {
          position: absolute;
          min-width: 100%;
          min-height: 100%;
          border: none;
        }
        a.gumroad-button {
          background-color: white !important;
          background-image: url("https://gumroad.com/button/button_bar.jpg") !important;
          background-repeat: repeat-x !important;
          border-radius: 4px !important;
          box-shadow: rgba(0, 0, 0, 0.4) 0 0 2px !important;
          color: #999 !important;
          display: inline-block !important;
          font-family: -apple-system, ".SFNSDisplay-Regular", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
          font-size: 16px !important;
          font-style: normal !important;
          font-weight: 500 !important;
          line-height: 50px !important;
          padding: 0 15px !important;
          text-shadow: none !important;
          text-decoration: none !important;
        }
      `;
      const ref = document.querySelector('script');
      ref.parentNode.insertBefore(style, ref);
    }

    setUrlSchemas() {
      const elem = document.getElementById('data-gumroad-script');

      if (elem && elem.dataset.gumroadSubdomain) this.acceptedUrlSchemas.push(`${elem.dataset.gumroadSubdomain}.gumroad.com`);
      if (elem && elem.dataset.gumroadCustomDomain) this.acceptedUrlSchemas.push(elem.dataset.gumroadCustomDomain);
    }

    constructSelectorRegexp() {
      const acceptedUrlSchemasSelector = this.acceptedUrlSchemas.join('|');
      this.selectorRegex = new RegExp(`(https?:)?//(${acceptedUrlSchemasSelector})/([^?/]+)`);
    }

    createOverlayContainer() {
      this.overlayContainer = document.createElement('div');
      this.overlayContainer.classList.add('gumroad-overlay');
      this.overlayContainer.style = convertStyles({
        maxWidth: `${window.screen.width}px`,
        maxHeight: `${window.screen.height}px`,
      });
      document.getElementsByTagName('body').item(0).appendChild(this.overlayContainer);
    }

    createIframe() {
      this.iframe = document.createElement('iframe');
      this.iframe.setAttribute('allowfullscreen', 'allowfullscreen');
      this.iframe.setAttribute('class', 'gumroad-overlay__iframe');
      this.iframe.setAttribute('scrolling', 'no');
      this.iframe.allowtransparency = true;
      this.iframe.style = convertStyles({
        width: 0,
        height: 0,
      });
      this.overlayContainer.appendChild(this.iframe);
    }

    setMessaging() {
      window.addEventListener('message', (e) => {
        if (e.data === 'gumroad-close') {
          this.closeIframe();
        }
      });
    }

    setupKeyListener() {
      document.addEventListener('keyup', (e) => {
        if (e.keyCode === 27 && this.activeLink) this.closeIframe();
      });
    }

    addLink(elem) {
      const href = elem.getAttribute('href');
      const matches = href && href.match(this.selectorRegex);

      if (matches) {
        this.links.push(new GumroadLink(elem, matches[matches.length - 1], this));
      }
    }

    parseLinks() {
      document.querySelectorAll('a').forEach((elem) => { this.addLink(elem); });
    }

    setupNewNodeObserver() {
      this.newNodeObserver = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === 'A') this.addLink(node);
          });
        });
      });
      this.newNodeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    openIframe() {
      this.overlayContainer.style = convertStyles({
        width: '100%',
        height: '100%',
      });

      this.iframe.style = convertStyles({
        width: `${window.screen.width}px`,
        height: `${window.screen.height}px`,
      });
      this.iframe.contentWindow.postMessage('iframe-opened', '*');
    }

    closeIframe() {
      this.activeLink = null;
      this.prefetchedLink = null;
      this.overlayContainer.style = convertStyles({
        width: 0,
        height: 0,
      });

      this.iframe.style = convertStyles({
        maxWidth: 0,
        maxHeight: 0,
        width: 0,
        height: 0,
      });
    }

    setActiveLink(link) {
      this.activeLink = link;
      if (this.prefetchedPermalink !== this.activeLink.productPermalink) {
        this.iframe.setAttribute('src', `/overlay.html?productId=${this.activeLink.productPermalink}`);
      }
      this.openIframe();
    }

    prefetchLink({ productPermalink }) {
      if (productPermalink !== this.prefetchedPermalink) {
        this.prefetchedPermalink = productPermalink;
        this.iframe.setAttribute('src', `/overlay.html?productId=${this.prefetchedPermalink}`);
      }
    }
  }

  function createGumroadWidget() {
    window.GumroadWidget || (window.GumroadWidget = new GumroadWidget());
  }

  window.addEventListener('load', createGumroadWidget);
}());
