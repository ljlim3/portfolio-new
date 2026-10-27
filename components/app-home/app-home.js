import { fetchHtmlContent, getStylesheet } from '../../utils/utils.js';
import '../station/station.js';
import '../carousel/carousel.js';

const SECTION_STATES = {
  home: { home: true, intro: false, proj: false },
  introduction: { home: false, intro: true, proj: false },
  projects: { home: false, intro: false, proj: true },
}

const SECTION_LINKS = {
  home: ' ',
  introduction: '#introduction',
  projects: '#projects'
}

class AppHomeComponent extends HTMLElement {

  static get SOURCE_URL() {
    return new URL('./app-home.html', import.meta.url);
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

    this._initialized = false;
    this._lastWidth = window.innerWidth;

    this._onScroll = this._onScroll.bind(this);
    this._ticking = false;
    this.progress = 0;

    this._signStops = [
      {
        left: null,
        right: 'Introduction'
      },
      {
        left: 'Home',
        right: 'Projects'
      },
      {
        left: 'Introduction',
        right: null
      }
    ];
  }

  // fired when instance of this custom element is added to the DOM
  async connectedCallback() {
    const template = await this.loadTemplate();
    await this.adoptStylesheets();

    this.shadowRoot.replaceChildren(template.content.cloneNode(true));

    this.selectedLink = 0;
    this.navLinks = this.shadowRoot.querySelectorAll('.routing-link');
    this.navBar = this.shadowRoot.querySelector('.train-map-wrapper');
    this.linkArr = this.shadowRoot.querySelectorAll('.routing-link');
    this.carouselComponent = this.shadowRoot.querySelector('carousel-component');
    this.stations = this.shadowRoot.querySelectorAll('station-template');
    this.currStation = null;
    this.prevStation = null;

    this.innerWrapperEl = this.shadowRoot.querySelector('.inner-wrapper');

    this.signageText;

    this.horizontalTween;
    this.start = 0;
    this.end = 0;

    this.timeoutIdUpdateUIScale;
    this.timeoutIdRefresh;
    this.timeoutIdTweenUpdate;
    
    this.userInitiatedScroll = false;
    this.prevPos = 0;
    this.screenResize = false;
    this.currentWidth = 0;
    this.appliedLink = { home: true, intro: false, proj: false };
    this.linkMap = { 0: 'home', 1: 'introduction', 2: 'projects'};
    this.stations.forEach((station, index) => {
      station.signStops = this._signStops[index];
    });

    this.carouselData = [
      { 
        src: 'static/restaurant-app.png',
        label: 'Restaurant App',
        link: '#/project?project=restaurant-app',
        key: 'restaurant-app'
      },
      { 
        src: 'static/emb-parent-dashboard-carousel-cover.png',
        label: 'EMBRACE',
        link: '#/project?project=embrace',
        key: 'embrace' 
      },
      { 
        src: 'static/theater-app-carousel-cover.png',
        label: 'Movie Theater App',
        link: '#/project?project=movie-theater-app',
        key: 'movie-theater-app' 
      }
    ];
    this.carouselComponent.data = this.carouselData;

    gsap.registerPlugin(ScrollTrigger);
    gsap.registerPlugin(ScrollToPlugin);
    ScrollTrigger.config({ 
      ignoreMobileResize: true 
    });

    clearTimeout(this.timeoutIdRefresh);
    this.timeoutIdRefresh = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100); // Small delay lets the browser draw the layout before measuring

    this.resizeObserver = new ResizeObserver((entries) => this.handleResizeObserved(entries));
    this.resizeObserver.observe(document.body);

    this.setupEventListeners();
    this.scrollAnimation();
    this.handleHash();
    this.handleIntroContentBtn();
  }

  _onScroll() {
    if (!this._ticking) {
      window.requestAnimationFrame(() => {
        this._calculateHorizontalScroll();
        this._ticking = false;
      });
      this._ticking = true;
    }
  }

  _calculateHorizontalScroll() {
    // 1. Get current horizontal scroll position
    const scrollLeft = window.scrollY || document.documentElement.scrollTop;
    
    // 2. Calculate the maximum possible horizontal scroll distance
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    if (maxScroll <= 0) return;

    // 3. Normalize to a value between 0.000 and 1.000
    this.progress = (scrollLeft / maxScroll).toFixed(3);

    clearTimeout(this.timeoutIdUpdateUIScale);
    this.timeoutIdUpdateUIScale = setTimeout(() => {
      this.updateRailwayScale();
    }, 0);
  }

  /**
   * app-home (load) -> 3 station-template (load)
   */

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(AppHomeComponent.SOURCE_URL);

      const template = doc.querySelector('#app-home-template');

      if (template) {
        return template;
      } else {
        console.error('Template element not found in the fetched file.');
      }
    } catch (error) {
      console.error('Could not process the source URL: ', error);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('./app-home.css?v=1', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  setupEventListeners() {
    this.navBar?.addEventListener('click', (e) => this.handleNavLinkClick(e));
    window.addEventListener('hashchange', () => this.handleHash());

    this.handleResize = () => {
      this.currentWidth = window.innerWidth;
      this.screenResize = true;
    }
    window.addEventListener('resize', () => this.handleResize());

    window.addEventListener("scroll", this._onScroll, { passive: true });
  }

  handleResizeObserved(entries) {
    for (let entry of entries) {
      const viewportWidth = entry.contentRect.width;
      const viewportHeight = entry.contentRect.height;
      this._isMobile = viewportWidth <= 576 || viewportHeight <= 576 ? true : false;
    }
  }

  handleIntroContentBtn() {
    const introText = this.shadowRoot.querySelector('.extended-text');
    const toggleDrawerBtn = this.shadowRoot.querySelector('.toggle-drawer-btn');
    const btnText = this.shadowRoot.querySelector('.btn-text');

    toggleDrawerBtn.addEventListener('click', () => {
      if (!this._isMobile) return;
      const isExpanded = introText.classList.toggle('is-expanded');

      if (isExpanded) {
        btnText.textContent = "Read less";
        toggleDrawerBtn.setAttribute('aria-expanded', true);
      } else {
        btnText.textContent = "Read more";
        toggleDrawerBtn.setAttribute('aria-expanded', false);
      }
    });
  }

  scrollXEvent() {
    this.dispatchEvent(new CustomEvent('scroll-x-update', {
      detail: { status: 'complete' },
      composed: true
    }));
  }

  handleNavLinkClick(e) {
    const target = e.target.closest('.routing-link');
  
    if (target) {
      const linkIndex = parseInt(target.dataset.linkIndex);
      this.userInitiatedScroll = false;
      this.screenResize = false;

      this.handleScrollTo(this.linkMap[linkIndex]);     
      this.handleNavUpdate(linkIndex);     
    }
  }

  handleNavUpdate(linkIndex) {
    if (this.selectedLink === linkIndex) return;

    this.navLinks[linkIndex].classList.add('selected');
    this.linkArr[this.selectedLink].classList.remove('selected');

    const hash = 
      linkIndex === 0 ? ' ' : 
      linkIndex === 1 ? '#introduction' :
      '#projects';

    history.replaceState(null, null, hash);

    this.selectedLink = linkIndex;
    const newState = SECTION_STATES[this.linkMap[linkIndex]];
    Object.assign(this.appliedLink, newState);
  }

  handleScrollTo(section) {
    gsap.to(window, {
      duration: 2,
      ease: "power2.inOut",
      scrollTo: () => {
        switch (section) {
          case 'home':
            return 0;
          case 'introduction':
            const sectionDistance = (this.end - this.start) / 2;
            const targetY = this.start + sectionDistance * 1;
            return targetY || window.innerWidth;              
          case 'projects':
            return 'max';
        }
      },
      onComplete: () => {
        if (section === this.prevStation?.id) return;

        switch (section) {
          case 'home':
            this.updateStation(0);
            this.updateA11y({stationIndex: 0, tabIndex: -1});
            break;
          case 'introduction':
            this.updateStation(1);
            this.updateA11y({stationIndex: 1, tabIndex: -1});
            break;          
          case 'projects':
            this.updateStation(2);
            this.updateA11y({stationIndex: 2, tabIndex: 0});
            break;
        }
      }
    });
  }

  updateA11y({stationIndex, tabIndex}) {
    this.signageText = this.stations[stationIndex].querySelector('.signage-text');

    if (this.signageText) {
      this.signageText.focus({preventScroll: true});
    }

    this.carouselComponent.tabIndex = tabIndex;
  }

  updateStation(index) {
    this.prevStation = this.currStation;
    this.currStation = this.stations[index];
  }

  updateRailwayScale() {
    const stations = this.shadowRoot.querySelectorAll('station-template');
    stations.forEach((stationEl) => {
      if (this.progress > 0.178) {
        stationEl.scaleDownRailway = true;
        stationEl.onScaleDownRailway();
      } else if (this.progress <= 0.178) {
        stationEl.scaleDownRailway = false;
        stationEl.onScaleDownRailway();
      }
    });
  }

  scrollAnimation() {
    const outerWrapperEl = this.shadowRoot.querySelector('.outer-wrapper');
    const innerWrapperEl = this.shadowRoot.querySelector('.inner-wrapper');
    const trainWheels = this.shadowRoot.querySelectorAll('.train-wheel');
    const trainEl = this.shadowRoot.querySelector('.train');

    function getScrollAmount () {
      const innerWrapperOffsetWidth = innerWrapperEl.offsetWidth;
      const windowInnerWidth = window.innerWidth;
      const visibleWidth = windowInnerWidth >= 1440 ? 1440 : windowInnerWidth;
      const scrollDistance = windowInnerWidth >= 1440 ? (1440 * 3) : innerWrapperOffsetWidth;

      return -(scrollDistance - visibleWidth);
    }

    this.handleWheel = async () => {
      this.userInitiatedScroll = true;
    }

    // listen for user-initiated scroll
    outerWrapperEl.addEventListener('wheel', this.handleWheel);
  
    this.horizontalTween = gsap.to(innerWrapperEl, {
      x: getScrollAmount,
      duration: 3,
      ease: "none",
      immediateRender: true,
    });


    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh(true); 
    }

    clearTimeout(this.timeoutIdTweenUpdate);
    this.timeoutIdTweenUpdate = setTimeout(() => {
      this.start = this.horizontalTween.scrollTrigger.start;
      this.end = this.horizontalTween.scrollTrigger.end;
    }, 50);
     
    ScrollTrigger.create({
      trigger: outerWrapperEl,
      start: "top top",
      end: `+=${getScrollAmount() * -1}`,
      scrub: 3,
      pin: true,
      animation: this.horizontalTween,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (self.progress > 0.8) {
          this.prevPos = self.progress;
        } else if (self.progress < 0.5) {
          this.prevPos = self.progress;
        }

        const currentX = self.progress;

        if (this.userInitiatedScroll || this.screenResize) {
          if (currentX <= 0.4) {
            const selectedIndex = parseInt(this.navLinks[0].dataset.linkIndex);
            if (!this.appliedLink.home && selectedIndex !== this.selectedLink) {
              this.updateStation(0);
              this.updateA11y({stationIndex: 0, tabIndex: -1});
              this.handleNavUpdate(selectedIndex);
            }
          } else if (currentX > 0.4 && currentX <= 0.8) {
            const selectedIndex = parseInt(this.navLinks[1].dataset.linkIndex);
            if (!this.appliedLink.introduction && selectedIndex !== this.selectedLink) {
              this.updateStation(1);
              this.updateA11y({stationIndex: 1, tabIndex: -1});
              this.handleNavUpdate(selectedIndex);
            }
          } else if (currentX > 0.8) {
            const selectedIndex = parseInt(this.navLinks[2].dataset.linkIndex);
            if (!this.appliedLink.project && selectedIndex !== this.selectedLink) {
              this.updateStation(2);
              this.updateA11y({stationIndex: 2, tabIndex: 0});
              this.handleNavUpdate(selectedIndex);
            }
          }
        }      
      }
    });

    trainWheels.forEach(trainWheel => {
      ScrollTrigger.create({
        trigger: trainWheel,
        pin: false,
        end:'+=4000vh',
        scrub: 1,
        onUpdate: (self) => {
          gsap.set(trainWheel, {
            rotation: self.progress * 1840
          });
        }
      });
    });

    ScrollTrigger.create({
      trigger: trainEl,
      pin: false,
      start: 0,
      scrub: 1,
      end: `+=${Math.min(window.innerWidth, 1440) * 1.8}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        gsap.to(trainEl, {        
          x: () => {
            const scrollDistance = Math.min(window.innerWidth, 1440);
            return scrollDistance * self.progress * 1.6;
          },
          width: () => {
            trainEl.style.bottom = self.progress > 0.2 ? "-0.3rem" : "1.5rem";
            return self.progress > 0.2 ? 
                    this._isMobile ? "15%" : "30%" : 
                    this._isMobile ? "50%" : "80%";
          },
          duration: 0.7, 
          ease: "pow2.inOut",
        })
      }
    });
  }

  handleHash() {
    const hash = window.location.hash;
    const linkIndex = hash === SECTION_LINKS['introduction'] ? 1 :
                      hash === SECTION_LINKS['projects'] ? 2 :
                      0;

    this.userInitiatedScroll = false;    
    this.screenResize = false;
    
    this.handleScrollTo(this.linkMap[linkIndex]);
    this.handleNavUpdate(linkIndex);
  }

  disconnectedCallback() {
    window.removeEventListener('haschange', this.handleHash);
    window.removeEventListener('resize', this.handleResize);
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    this.horizontalTween?.kill();
    this.outerWrapperEl?.removeEventListener('wheel', this.handleWheel);
    clearTimeout(this.timeoutIdRefresh);
    clearTimeout(this.timeoutIdTweenUpdate);
    clearTimeout(this.timeoutIdUpdateUIScale);
  }
}
customElements.define('app-home-component', AppHomeComponent);
