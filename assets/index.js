
//li
let btn = document.querySelectorAll(".delete");
btn.forEach((el)=>{
let text = el.parentElement.innerText;
let body = text.split(":")[0].trim();
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



