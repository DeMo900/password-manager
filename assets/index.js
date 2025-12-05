
//li
let ul = document.getElementById("ul");
let body = ul.innerHTML.split(":")[0]
let splitbody = body.split(">")[1].trim();
console.log(splitbody);
li.addEventListener("click", () => {
    fetch(`/delete/${splitbody}`, {
        method: "DELETE",
    })
    .then(res => {
        if (res.ok) {
            window.location.reload();
        }
    })
    .catch(err => {
        console.error(err);
    });
});
