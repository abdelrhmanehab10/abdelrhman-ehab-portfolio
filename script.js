const works = [
  {
    id: 0,
    imgLink: "assets/works/faster-meet-next.png",
    title: "Faster Meet",
    desc: "Faster Meet is a web application that allows users to schedule meetings. It provides a user-friendly interface for creating and managing events. The application is built using Next.js, a popular React framework for server-side rendering and optimized performance.",
    category: "NEXT JS",
  },
  {
    id: 1,
    imgLink: "assets/works/news-admin-angular.png",
    title: "News Admin",
    desc: "News Admin is a web application that allows users to manage news articles. It provides a user-friendly interface for creating, editing, and deleting news articles. The application is built using Angular, a popular JavaScript framework for building dynamic web applications.",
    category: "ANGULAR JS",
  },
  {
    id: 2,
    imgLink: "assets/works/cinemation-next.png",
    title: "Cinemation",
    desc: "Cinemation is a web application that allows users to search about movies & series using ai. It provides a user-friendly interface for finding movies and series based on user preferences. The application is built using Next.js, a popular React framework for server-side rendering and optimized performance.",
    category: "NEXT JS",
  },
];

const worksContainer = document.querySelector("#works > div");

worksContainer.innerHTML = works
  .map(
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
    </div>`
  )
  .join("");
