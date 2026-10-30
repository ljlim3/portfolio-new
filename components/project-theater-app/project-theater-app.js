import { fetchHtmlContent, getStylesheet } from "../../utils/utils.js";

class ProjectTheaterAppComponent extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./project-theater-app.html', import.meta.url);
  }
  
  constructor() {
    super(); // initialize the base class

    this.attachShadow({ mode: 'open' }); // attaches a shadow DOM tree to the element and returns a reference to its shadow root
  }

  async connectedCallback() {
    const template = await this.loadTemplate();
    if (template)
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    
    this.adoptStylesheets();

    const heading = this.shadowRoot.querySelector('[data-heading]');
    if (heading) {
      heading.focus();
    }
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(ProjectTheaterAppComponent.SOURCE_URL);
      const template = doc.getElementById('project-theater-app-template');

      if (template) return template;

      console.error('Could not find template element in the html file.')
    } catch(error) {
      console.log('Could not load template: ', error);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('../project-shared/project-shared.css', import.meta.url),
       'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssUrls.map(url => getStylesheet(url)));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }
}
customElements.define('project-theater-app-component', ProjectTheaterAppComponent);