import { fetchHtmlContent, getStylesheet } from "../../utils/utils.js";

class CarouselComponent extends HTMLElement {
  #data;

  static get SOURCE_URL() {
    return new URL('./carousel.html', import.meta.url);
  }

  set data(items = []) {
    this.#data = items.map(({ src, label, link = undefined }) => ({ src, label, link }));
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' }); // allows access to internal structure for external scripts through element.shadowRoot
    this._initialized = false;
    this.#data = [];
  }

  async connectedCallback() {
    const template = await this.loadTemplate();
    await this.adoptStyleSheets();

    if (template) {
      this.shadowRoot.replaceChildren(template.content.cloneNode(true));
    }

    this.carousel = this.shadowRoot.querySelector('.carousel');
    this.populateItems(this.#data);
    this.carousel.addEventListener('focusin', (e) => this.handleFocus(e));
  }

  handleFocus(event) {
    const target = event.target.closest('.item');

    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', inline: 'nearest'});
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(CarouselComponent.SOURCE_URL);

      const template = doc.getElementById('carousel-component-template');
      if (template) {
        return template;
      } else {
        console.error('Could not find the template element');
      }
    } catch(e) {
      console.error('Failed to process source file', e);
    }
  }

  async adoptStyleSheets() {
    const cssUrls = [
      new URL('./carousel.css', import.meta.url)
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  populateItems(data) {
    const fragment = document.createDocumentFragment();

    data.forEach((d, i) => {
      const listItem = document.createElement('li');
      listItem.classList.add('item');
      listItem.setAttribute('part', 'item');
      listItem.setAttribute('aria-label', `slide ${i + 1} of ${data.length}`);
      listItem.dataset.val = `${i}`;

      const img = document.createElement('img');
      img.setAttribute('src', d.src);
      img.setAttribute('alt', d.label);

      const labelContainer = document.createElement('div');
      labelContainer.classList.add('item-label-container');

      const label = document.createElement('span');
      label.classList.add('item-label');
      label.textContent = d.label;

      labelContainer.appendChild(label);

      if (d.link) {
        const link = document.createElement('a');
        link.setAttribute('href', d.link);
        link.appendChild(img);
        link.appendChild(labelContainer);
        listItem.appendChild(link);
      } else {
        listItem.appendChild(img);
        listItem.appendChild(labelContainer);
      }

      fragment.appendChild(listItem);
    });
    this.carousel.replaceChildren(fragment);
  }
}
customElements.define('carousel-component', CarouselComponent);