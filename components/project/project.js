import { fetchHtmlContent, getStylesheet } from '../../utils/utils.js';
import { appRouter } from '../../router.js';
import '../pagination-button/pagination-button.js';
import '../nav-dropdown/nav-dropdown.js';
import '../project-theater-app/project-theater-app.js';
import '../project-embrace/project-embrace.js';
import '../project-restaurant/project-restaurant.js';

class ProjectComponent extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./project.html', import.meta.url);
  }

  constructor() {
    super(); // initialize the base class

    this.attachShadow({ mode: 'open' }); // mode - about accessing the shadow root of component from the outside
 
    this._initialized = false;
    this.selectedProject = null;
    this.projects = [
      {
        key: 'restaurant-app',
        label: 'Restaurant App',
        tagName: 'project-restaurant-component',
        link: '#/project?project=restaurant-app'
      },
      {
        key: 'embrace',
        label: 'EMBRACE',
        tagName: 'project-embrace-component',
        link: '#/project?project=embrace'
      },
      {
        key: 'movie-theater-app',
        label: 'Movie Theater App',
        tagName: 'project-theater-app-component',
        link: '#/project?project=movie-theater-app'
      }
    ];
    this.projectMap = Object.fromEntries(
      this.projects.map(project => [project.key, project.tagName])
    );
  }

  async connectedCallback() {
    const template = await this.loadTemplate();
    if (template) this.shadowRoot.replaceChildren(template.content.cloneNode(true));

    await this.adoptStylesheets();

    this.paginations = this.shadowRoot.querySelectorAll('pagination-button-component');

    this.setSelectedProject();
    this.populateNavItems();
    this.setPaginationBtns();
    this.updatePaginationBtns();

    this._initialized = true;
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(ProjectComponent.SOURCE_URL);
      const template = doc.getElementById('project-template');

      if (template) {
        return template;
      }
      console.error('Template element not found in the html file.')
    } catch (e) {
      console.log('Could not process source url: ', e);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('./project.css', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  populateNavItems() {
    const nav = this.shadowRoot.querySelector('nav-dropdown-component');

    if (!nav) return;

    nav.dropdownItemsData = [
      {
        label: 'Restaurant App',
        link: '#/project?project=restaurant-app',
        key: 'restaurant-app'
      }, 
      { 
        label: 'EMBRACE',
        link: '#/project?project=embrace',
        key: 'embrace' 
      },
      { 
        label: 'Movie Theater App',
        link: '#/project?project=movie-theater-app',
        key: 'movie-theater-app'
      }
    ];

    nav.selected = this.selectedProject;
  }

  setSelectedProject() {
    const requestedProject = appRouter.projectId();
    this.selectedProject = this.projectMap[requestedProject] ? requestedProject : 'movie-theater-app';
    this.renderProject();
  }

  getProjectIndex() {
    const index = this.projects.findIndex(
      project => project.key === this.selectedProject
    );
    return index;
  }

  getAdjacentProject(direction) {
    const currIndex = this.getProjectIndex();
    const adjacentIndex = (currIndex + direction + this.projects.length) % this.projects.length;
    return this.projects[adjacentIndex];
  }

  setPaginationBtns() {
    const paginationLeft = this.paginations[0];
    const paginationRight = this.paginations[1];
    const projectLeft = this.getAdjacentProject(-1);
    const projectRight = this.getAdjacentProject(1);

    paginationLeft.label = projectLeft.label;
    paginationRight.label = projectRight.label;
  }

  updatePaginationBtns() {
    const paginationLeft = this.paginations[0];
    const paginationRight = this.paginations[1];

    paginationLeft.addEventListener('paginationBtnClick', (e) => {
      const projectLeftBeforeRoute = this.getAdjacentProject(-1);
      const projectRightBeforeRoute = this.getAdjacentProject(1);
      this.selectedProject = projectLeftBeforeRoute.key;
      this.renderProject();

      paginationLeft.newUrl = projectLeftBeforeRoute.link;
      paginationRight.newUrl = projectRightBeforeRoute.link;

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

       // update the prev and next pagination buttons after route happens
      const projectLeftAfterRoute = this.getAdjacentProject(-1);
      const projectRightAfterRoute = this.getAdjacentProject(1);

      paginationLeft.label = projectLeftAfterRoute.label;
      paginationRight.label = projectRightAfterRoute.label;

      // update nav dropdown
      this.shadowRoot.querySelector('nav-dropdown-component').selected = this.selectedProject;
    });

    paginationRight.addEventListener('paginationBtnClick', (e) => {
      const projectLeftBeforeRoute = this.getAdjacentProject(-1);
      const projectRightBeforeRoute = this.getAdjacentProject(1);

      this.selectedProject = projectRightBeforeRoute.key;
      this.renderProject();

      paginationLeft.newUrl = projectLeftBeforeRoute.link;
      paginationRight.newUrl = projectRightBeforeRoute.link;

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // update the prev and next pagination buttons after route happens
      const projectLeftAfterRoute = this.getAdjacentProject(-1);
      const projectRightAfterRoute = this.getAdjacentProject(1);

      paginationLeft.label = projectLeftAfterRoute.label;
      paginationRight.label = projectRightAfterRoute.label;


      // update nav dropdown
      this.shadowRoot.querySelector('nav-dropdown-component').selected = this.selectedProject;
    });
  }

  renderProject() {
    const tagName = this.projectMap[this.selectedProject];
    const projectComponent = document.createElement(tagName);
    const projectContent = this.shadowRoot.getElementById('project-content');
    projectContent.replaceChildren(projectComponent);
  }

  routeChanged(url) {
    const project = appRouter.projectId();

    if (!this.projectMap[project] || project === this.selectedProject) return;

    this.selectedProject = project;
    this.renderProject();
    this.shadowRoot.querySelector('nav-dropdown-component').selected = project;
    this.setPaginationBtns();
  }

  disconnectedCallback() {

  }
}
customElements.define('project-component', ProjectComponent); // define custom element
