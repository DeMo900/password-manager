
//li
let li = document.querySelectorAll(".li");
li.forEach((el)=>{
let body = el.innerHTML.split(":")[0]
el.addEventListener("click", () => {
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
})



