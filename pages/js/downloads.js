var link_origin = "https://api.github.com/repos/cloudwolfyt/";

function change_link(e) {
  e.parentElement.querySelector('.button').href = link_origin + e.value;
  console.log(e.parentElement.querySelector('.button').href);
}