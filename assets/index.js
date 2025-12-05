
//li
let li = document.getElementById("li");
let body = li.innerHTML.split(":")[0]
console.log(body);
li.addEventListener("click", () => {
    fetch(`/delete/${body}`, {
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
