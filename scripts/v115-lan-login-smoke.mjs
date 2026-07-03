const host = process.env.PRIJ_LAN_HOST || "100.127.4.46";
const webOrigin = `http://${host}:3000`;
const apiOrigin = `http://${host}:3001`;

async function check(url, label, required = true) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    if (response.status >= 200 && response.status < 500) {
      console.log(`PASS ${label}: ${url} -> ${response.status}`);
      return true;
    }
    throw new Error(`unexpected status ${response.status}`);
  } catch (error) {
    const message = `${label} is not reachable at ${url}. Start the LAN profile first and check firewall/routing. ${String(error)}`;
    if (required) {
      throw new Error(message);
    }
    console.warn(`WARN ${message}`);
    return false;
  }
}

await check(webOrigin, "web");
await check(`${webOrigin}/login`, "login page");
await check(`${apiOrigin}/health`, "API health", false);
console.log(`LAN smoke target web=${webOrigin} api=${apiOrigin}`);
