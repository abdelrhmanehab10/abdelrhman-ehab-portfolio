const works = [
  {
    id: 0,
    imgLink: "assets/works/Frontend-Mentor-FAQ-Accordion-Card.png",
    title: "FAQ Accordion",
    desc: "FAQ accordion is a collapsible UI element for displaying frequently asked questions. It's built using HTML, CSS, and JavaScript for a user-friendly experience.",
    category: "HTML & CSS",
    demoLink:
      "https://abdelrhmanehab10.github.io/frontend-mentor/faq-accordion-card/",
  },
  {
    id: 1,
    imgLink: "assets/works/React-App.png",
    title: "Food menu & cart",
    desc: "Is a dynamic and interactive way to display menu items, add to cart and process orders. It utilizes the power of React's component-based architecture and state management for a seamless user experience.",
    category: "REACT JS",
    demoLink:
      "https://abdelrhmanehab10.github.io/food-app/",
  },
  {
    id: 2,
    imgLink: "assets/works/Tabs-Project.png",
    title: "Tabs project",
    desc: "Tabs project built with Next js is a simple yet effective way to organize content into tabs. It leverages the power of Next js for server-side rendering and optimized performance.",
    category: "NEXT JS",
    demoLink:
      "https://nextjs-swart-delta.vercel.app/",
  },
];

const worksContainer = document.querySelector("#works > div");

worksContainer.innerHTML = works.map(
  ({ id, imgLink, title, desc, category, demoLink }) =>
    `${
      id % 2 === 1
        ? `<div key=${id} class="work odd">`
        : `<div key=${id} class="work">`
    }
      <img src=${imgLink} alt="project" />
      <div class="details">
        <h6>${title}</h6>
        <p>
          ${desc.split(".")[0] + "."}
          <span>${desc.split(".")[1] + "."}</span>
        </p>
        <p class="category">${category}</p>
        <button>
          <a href=${demoLink}>
            View More
            <i class="fa-solid fa-chevron-right"></i>
          </a>
        </button>
      </div>
    </div>`
);
