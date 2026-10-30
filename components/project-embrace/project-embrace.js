import { fetchHtmlContent, getStylesheet } from "../../utils/utils.js";

class ProjectEmbraceComponent extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./project-embrace.html', import.meta.url);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const template = await this.loadTemplate();
    if (template) {
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }
    this.adoptStylesheets();

    const heading = this.shadowRoot.querySelector('[data-heading]');
    if (heading) {
      heading.focus();
    }
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(ProjectEmbraceComponent.SOURCE_URL);
      const template = doc.getElementById('project-embrace-template');

      if (template) return template;

      console.error('Template not found');
    } catch(error) {
      console.log('Could not fetch HTML content: ', error);
    }
  }

  async adoptStylesheets() {
    const cssURLs = [
      new URL('../project-shared/project-shared.css', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssURLs.map(url => getStylesheet(url)));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }
}
customElements.define('project-embrace-component', ProjectEmbraceComponent);