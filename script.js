const works = [
  {
    id: 0,
    imgLink: "assets/works/Guess-My-Number-.png",
    title: "Guess Number Game",
    desc: "The Number Guessing Game is an interactive and engaging web-based game that showcases the incredible power of JavaScript. This game challenges players to guess a random number between 1 and 100, providing them with an opportunity to test their intuition and deductive skills.",
    category: "JS",
    demoLink: "https://abdelrhmanehab10.github.io/guess-game-js/",
  },
  {
    id: 1,
    imgLink: "assets/works/React-App.png",
    title: "Food menu & cart",
    desc: "Is a dynamic and interactive way to display menu items, add to cart and process orders. It utilizes the power of React's component-based architecture and state management for a seamless user experience.",
    category: "REACT JS",
    demoLink: "https://abdelrhmanehab10.github.io/food-app/",
  },
  {
    id: 2,
    imgLink: "assets/works/SwiftMarket.png",
    title: "E-Commerce",
    desc: "E-Commerce built with Next js. It leverages the power of Next js for server-side rendering and optimized performance.",
    category: "NEXT JS",
    demoLink: "https://e-commerce-nine-self.vercel.app/",
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
