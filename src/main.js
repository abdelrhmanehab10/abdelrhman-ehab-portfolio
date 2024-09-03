import { works } from "./constant/index.js";

class Menu {
  constructor() {
    this.menuLinks = document.querySelectorAll(`.menu li`);
    this.init();
  }

  init() {
    window.addEventListener("scroll", this.updateActiveClass.bind(this));
    this.updateActiveClass();
  }

  updateActiveClass() {
    let currentActive = null;

    this.menuLinks.forEach((link) => {
      const section = document.querySelector(
        link.querySelector("a").getAttribute("href")
      );
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (
        window.scrollY >= sectionTop - sectionHeight / 2 &&
        window.scrollY < sectionTop + sectionHeight / 2
      ) {
        currentActive = link;
      }
    });

    this.menuLinks.forEach((link) => link.classList.remove("active"));

    if (currentActive) {
      currentActive.classList.add("active");
    }
  }
}

class Work {
  constructor() {
    this.worksContainer = document.querySelector("#works > div");
    this.renderWorks();
  }

  renderWorks() {
    this.worksContainer.innerHTML = works
      .map((work) => this.renderWork(work))
      .join("");
  }

  renderWork({ id, imgLink, title, desc, category, demoLink }) {
    return `
      <div key=${id} class="work ${id % 2 === 1 ? "odd" : ""}">
        <img src=${imgLink} alt="project" />
        <div class="details">
          <h6>${title}</h6>
          <p>
            ${desc.split(".")[0] + "."}
            <span>${desc.split(".")[1] + "."}</span>
          </p>
          <p class="category">${category}</p>
          ${
            demoLink
              ? `<button>
                  <a href=${demoLink}>
                    View More
                    <i class="fa-solid fa-chevron-right"></i>
                  </a>
                </button>`
              : ""
          }
        </div>
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  new Menu();
  new Work();
});
