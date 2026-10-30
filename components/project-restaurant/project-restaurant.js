import { fetchHtmlContent, getStylesheet } from "../../utils/utils.js";

class ProjectRestaurantComponent extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./project-restaurant.html', import.meta.url);
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await this.loadTemplate();
    await this.adoptStylesheets();

    const heading = this.shadowRoot.querySelector('[data-heading]');
    if (heading) {
      heading.focus();
    }
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(ProjectRestaurantComponent.SOURCE_URL);
      const template = doc.getElementById('project-restaurant-template');

      if (template) {
        this.shadowRoot.replaceChildren(template.content.cloneNode(true));
        return;
      }

      console.error('Template element not found');

    } catch (error) {
      console.log('Error loading html template:', error);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('../project-shared/project-shared.css', import.meta.url)
    ];

    const stylesheets = await Promise.all(cssUrls.map(url => getStylesheet(url)));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }
}
customElements.define('project-restaurant-component', ProjectRestaurantComponent);