let isCheckingTipped = false;

function waitForElement(selector, callback) {
  const observer = new MutationObserver((_, obs) => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      obs.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

async function addTipButton() {
  if (isCheckingTipped) return;
  isCheckingTipped = true;

  waitForElement("#triggersButton", async (triggersButton) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData?.user?.access_token) return;

    const accessToken = userData.user.access_token;
    const url = new URL(window.location.href);
    const levelParam = url.searchParams.get("level");
    if (!levelParam) return;

    const [levelId, timestamp] = levelParam.split(":");
    const hasTippedUrl = `https://api.slin.dev/grab/v1/has_tipped_currency/${levelId}/${timestamp}?access_token=${accessToken}`;

    try {
      const hasTippedResponse = await fetch(hasTippedUrl);
      const hasTippedText = await hasTippedResponse.text();
      const alreadyTipped = hasTippedText.trim().toLowerCase() === "yes";

      let tipButton = document.getElementById("tipLevelButton");
      if (!tipButton) {
        tipButton = document.createElement("button");
        tipButton.id = "tipLevelButton";

        const styles = window.getComputedStyle(triggersButton);
        tipButton.style.backgroundColor = "rgb(0, 174, 239)";
        tipButton.style.color = styles.color;
        tipButton.style.border = styles.border;
        tipButton.style.padding = styles.padding;
        tipButton.style.margin = styles.margin;
        tipButton.style.fontSize = styles.fontSize;
        tipButton.style.fontWeight = styles.fontWeight;
        tipButton.style.borderRadius = styles.borderRadius;
        tipButton.style.cursor = styles.cursor;
        tipButton.style.width = styles.width;
        tipButton.style.whiteSpace = "nowrap";
        tipButton.style.minWidth = "100px";

        tipButton.addEventListener("click", () => handleTipButtonClick(levelId, timestamp, accessToken, tipButton));
        triggersButton.insertAdjacentElement("afterend", tipButton);
      }

      tipButton.textContent = alreadyTipped ? "Already Tipped" : "Tip Level";
      tipButton.disabled = alreadyTipped;
    } finally {
      isCheckingTipped = false;
    }
  });
}

async function handleTipButtonClick(levelId, timestamp, accessToken, tipButton) {
  try {
    const apiUrl = `https://api.slin.dev/grab/v1/tip_currency/${levelId}/${timestamp}?access_token=${accessToken}`;
    await fetch(apiUrl, { method: "POST", headers: { "Content-Type": "application/json" } });

    const hasTippedUrl = `https://api.slin.dev/grab/v1/has_tipped_currency/${levelId}/${timestamp}?access_token=${accessToken}`;
    const hasTippedResponse = await fetch(hasTippedUrl);
    const hasTippedText = await hasTippedResponse.text();

    if (hasTippedText.trim().toLowerCase() === "yes") {
      tipButton.textContent = "Already Tipped";
      tipButton.disabled = true;
    }
  } catch {}
}

document.addEventListener("DOMContentLoaded", addTipButton);
document.addEventListener("readystatechange", addTipButton);
window.addEventListener("load", addTipButton);
