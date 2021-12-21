"use strict";

// ==UserScript==
// @author       Flleeppyy
// @description  Shows the total size of all files in a given listing.
// @name         archive.org-show-total-size
// @include      /https?:\/\/(www\.)?archive\.org\/(details|download)\/.*/
// @icon         https://archive.org/favicon.ico
// @namespace    https://fleepy.tv
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/flleeppyy/archive.org-show-total-size/master/lib/index.js
// @source       https://github.com/flleeppyy/archive.org-show-total-size
// @homepage     https://github.com/flleeppyy/archive.org-show-total-size
// @supportURL   https://github.com/flleeppyy/archive.org-show-total-size/issues
// @license      MIT
// @version      0.1
// ==/UserScript==
// This SIAF is Patrick Kettner's filesize-parser on github
// We cannot require it because it uses module.exports
// https://github.com/patrickkettner/filesize-parser
(function () {
  "use strict"; // use the file parser

  const validAmount = function validAmount(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };

  const parsableUnit = function parsableUnit(u) {
    return u.match(/\D*/).pop() === u;
  };

  const incrementBases = {
    2: [[["b", "bit", "bits"], 1 / 8], [["B", "Byte", "Bytes", "bytes"], 1], [["Kb"], 128], [["k", "K", "kb", "KB", "KiB", "Ki", "ki"], 1024], [["Mb"], 131072], [["m", "M", "mb", "MB", "MiB", "Mi", "mi"], Math.pow(1024, 2)], [["Gb"], 1.342e8], [["g", "G", "gb", "GB", "GiB", "Gi", "gi"], Math.pow(1024, 3)], [["Tb"], 1.374e11], [["t", "T", "tb", "TB", "TiB", "Ti", "ti"], Math.pow(1024, 4)], [["Pb"], 1.407e14], [["p", "P", "pb", "PB", "PiB", "Pi", "pi"], Math.pow(1024, 5)], [["Eb"], 1.441e17], [["e", "E", "eb", "EB", "EiB", "Ei", "ei"], Math.pow(1024, 6)]],
    10: [[["b", "bit", "bits"], 1 / 8], [["B", "Byte", "Bytes", "bytes"], 1], [["Kb"], 125], [["k", "K", "kb", "KB", "KiB", "Ki", "ki"], 1000], [["Mb"], 125000], [["m", "M", "mb", "MB", "MiB", "Mi", "mi"], 1.0e6], [["Gb"], 1.25e8], [["g", "G", "gb", "GB", "GiB", "Gi", "gi"], 1.0e9], [["Tb"], 1.25e11], [["t", "T", "tb", "TB", "TiB", "Ti", "ti"], 1.0e12], [["Pb"], 1.25e14], [["p", "P", "pb", "PB", "PiB", "Pi", "pi"], 1.0e15], [["Eb"], 1.25e17], [["e", "E", "eb", "EB", "EiB", "Ei", "ei"], 1.0e18]]
  }; // Only thing we're changing here is declaring the function to window.

  window.filesize = function (input) {
    var options = arguments[1] || {};
    var base = parseInt(options.base || 2);
    var parsed = input.toString().match(/^([0-9\.,]*)(?:\s*)?(.*)$/);
    var amount = parsed[1].replace(",", ".");
    var unit = parsed[2];

    var validUnit = function validUnit(sourceUnit) {
      return sourceUnit === unit;
    };

    if (!validAmount(amount) || !parsableUnit(unit)) {
      throw "Can't interpret " + (input || "a blank string");
    }

    if (unit === "") return Math.round(Number(amount));
    var increments = incrementBases[base];

    for (var i = 0; i < increments.length; i++) {
      var _increment = increments[i];

      if (_increment[0].some(validUnit)) {
        return Math.round(amount * _increment[1]);
      }
    }

    throw unit + " doesn't appear to be a valid unit";
  };
})();

(function () {
  "use strict";

  if (window.location.pathname.startsWith("/details/")) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://archive.org/metadata/" + window.location.pathname.split("/")[2] + "/files", true);

    xhr.onload = function () {
      if (xhr.status == 200) {
        // parse the response
        const {
          result: results
        } = JSON.parse(xhr.responseText);
        let total_size = 0;
        results.forEach(file => {
          const int = parseInt(file.size);

          if (int) {
            total_size += int;
          }
        });
        let para = document.createElement("p");
        para.innerHTML = "Total size: " + (total_size / Math.pow(1024, 3)).toPrecision(3) + " GB";
        document.getElementsByClassName("item-stats-summary")[0].appendChild(para);
      } else {
        console.error(xhr.status, "Error: " + xhr);
      }
    };

    xhr.send();
  } else if (window.location.pathname.startsWith("/download/")) {
    const listings = document.getElementsByClassName("directory-listing-table")[0].childNodes[3];
    const listings_rows = listings.getElementsByTagName("tr");
    const files = [];
    const file_sizes = [];

    for (let i = 0; i < listings_rows.length; i++) {
      const row = listings_rows[i];
      const columns = row.getElementsByTagName("td");
      const file_link = columns[0].getElementsByTagName("a")[0].innerHTML;
      const file_name = file_link.substring(0, file_link.length - 1);
      const file_size = columns[2].innerText;
      files.push({
        file_name: file_name,
        file_size: file_size
      });
    }

    files.forEach(file => {
      // format the file size to be in bytes
      try {
        const file_size = window.filesize(file.file_size);
        file_sizes.push(file_size);
      } catch (e) {}
    }); // join together all the file sizes

    const total_size = file_sizes.reduce((a, b) => a + b, 0);
    const total_size_human = (total_size / Math.pow(1024, 3)).toPrecision(3) + " GB"; // god....

    document.getElementsByClassName("directory-listing-table")[0].childNodes[1].childNodes[1].childNodes[4].innerHTML += " - " + total_size_human; // do this better please.
  }
})();