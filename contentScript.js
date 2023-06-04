// contentScript.js
chrome.runtime.sendMessage({ action: 'fetchData' }, function (response) {
  // Modify the DOM of staff.mydomain.ca to display the retrieved information
});
