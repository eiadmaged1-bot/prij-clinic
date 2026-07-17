const url = "http://127.0.0.1:3001";
async function run() {
  const login = await fetch(`${url}/auth/login`, {
    method: "POST", headers: {"content-type": "application/json"},
    body: JSON.stringify({identifier: "eyad", password: "Prij123!"})
  });
  const cookie = login.headers.get("set-cookie");
  const search = await fetch(`${url}/guidelines/search?q=NG192`, {
    headers: { "cookie": cookie }
  });
  const data = await search.json();
  console.log(JSON.stringify(data, null, 2));
}
run().catch(console.error);
