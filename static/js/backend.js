async function fetchuser() {
   res = await fetch("static/api/user");
   if(res.ok) {
      u = await res.json();
      return u
   }
   else if(res.status == 401) {
      location.href = "/api/login?next=" + location.href;
   }
   else {
      throw res.statusText;
   }
}
async function fetchdocs() {
   res = await fetch("static/api/doc");
   if(res.ok) {
      u = await res.json();
      return u
   }
   else {
      throw res.statusText;
   }
}
