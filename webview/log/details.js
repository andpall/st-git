const MAX_LISTED_BRANCHES = 8;

function textBlock(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function branchesText(branches) {
  if (!branches.length) return 'Not in any branch';
  const listed = branches.slice(0, MAX_LISTED_BRANCHES);
  const more = branches.length - listed.length;
  const names = listed.join(', ');
  return more > 0 ? `In ${names} and ${more} more` : `In ${names}`;
}

function renderDetails(details) {
  detailsPanel.hidden = !details;
  if (!details) return;
  const date = new Date(details.date * 1000);
  const meta = `${details.hash.slice(0, 10)} by ${details.author} <${details.email}> on ${date.toLocaleString()}`;
  detailsPanel.replaceChildren(
    textBlock('div', 'message', details.message),
    textBlock('div', 'meta', meta),
    textBlock('div', 'meta', branchesText(details.branches)),
  );
}
