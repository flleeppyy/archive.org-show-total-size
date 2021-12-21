// ==UserScript==
// @name         archive.org show file total size
// @namespace    https://fleepy.tv
// @version      0.1
// @description  Shows the total size of all files in a given listing.
// @author       Flleeppyy
// @match        https://archive.org/
// @icon         https://archive.org/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  if (window.location.pathname.startsWith("/details/")) {
    // make a request to archive.org's API to get the total size of all files in the listing
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://archive.org/metadata/" + window.location.pathname.split("/")[2] + "/files", true);
    
    xhr.onload = function() {
      if (xhr.status == 200) {
        // parse the response
        const response = JSON.parse(xhr.responseText);
        let totalSize = 0;
        for (let i = 0; i < response.result.length; i++) {
          try {
            totalSize += parseInt(response.result[i].size);
          } catch (e) { }
        }
        // add the total size to the page
        let div = document.createElement("div");
        div.innerHTML = "Total size: " + totalSize + " bytes";
        // boxy item-stats-summary
        let boxy = document.getElementsByClassName("item-stats-summary")[0];
      }
    }
  } else if (window.location.pathname.startsWith("/download/")) {

    const listings = document.getElementsByClassName("directory-listing-table")[0].childNodes[3]
    const listings_rows = listings.getElementsByTagName("tr");

    const files = [];

    const file_sizes = []

    const validAmount = function(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    };

    const parsableUnit = function(u) {
      return u.match(/\D*/).pop() === u;
    };

    const incrementBases = {
      2: [
        [["b", "bit", "bits"], 1/8],
        [["B", "Byte", "Bytes", "bytes"], 1],
        [["Kb"], 128],
        [["k", "K", "kb", "KB", "KiB", "Ki", "ki"], 1024],
        [["Mb"], 131072],
        [["m", "M", "mb", "MB", "MiB", "Mi", "mi"], Math.pow(1024, 2)],
        [["Gb"], 1.342e+8],
        [["g", "G", "gb", "GB", "GiB", "Gi", "gi"], Math.pow(1024, 3)],
        [["Tb"], 1.374e+11],
        [["t", "T", "tb", "TB", "TiB", "Ti", "ti"], Math.pow(1024, 4)],
        [["Pb"], 1.407e+14],
        [["p", "P", "pb", "PB", "PiB", "Pi", "pi"], Math.pow(1024, 5)],
        [["Eb"], 1.441e+17],
        [["e", "E", "eb", "EB", "EiB", "Ei", "ei"], Math.pow(1024, 6)]
      ],
      10: [
        [["b", "bit", "bits"], 1/8],
        [["B", "Byte", "Bytes", "bytes"], 1],
        [["Kb"], 125],
        [["k", "K", "kb", "KB", "KiB", "Ki", "ki"], 1000],
        [["Mb"], 125000],
        [["m", "M", "mb", "MB", "MiB", "Mi", "mi"], 1.0e+6],
        [["Gb"], 1.25e+8],
        [["g", "G", "gb", "GB", "GiB", "Gi", "gi"], 1.0e+9],
        [["Tb"], 1.25e+11],
        [["t", "T", "tb", "TB", "TiB", "Ti", "ti"], 1.0e+12],
        [["Pb"], 1.25e+14],
        [["p", "P", "pb", "PB", "PiB", "Pi", "pi"], 1.0e+15],
        [["Eb"], 1.25e+17],
        [["e", "E", "eb", "EB", "EiB", "Ei", "ei"], 1.0e+18]
      ]
    };


    const filesize = function (input) {
      var options = arguments[1] || {};
      var base = parseInt(options.base || 2);

      var parsed = input.toString().match(/^([0-9\.,]*)(?:\s*)?(.*)$/);
      var amount = parsed[1].replace(',','.');
      var unit = parsed[2];

      var validUnit = function(sourceUnit) {
        return sourceUnit === unit;
      };

      if (!validAmount(amount) || !parsableUnit(unit)) {
        throw 'Can\'t interpret ' + (input || 'a blank string');
      }
      if (unit === '') return Math.round(Number(amount));

      var increments = incrementBases[base];
      for (var i = 0; i < increments.length; i++) {
        var _increment = increments[i];

        if (_increment[0].some(validUnit)) {
          return Math.round(amount * _increment[1]);
        }
      }

      throw unit + ' doesn\'t appear to be a valid unit';
    };
    // end fileparser


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
        const file_size = filesize(file.file_size);
        file_sizes.push(file_size);
      } catch (e) {}
    });

    // find file sizes that are empty


    // join together all the file sizes
    const total_size = file_sizes.reduce((a, b) => a + b, 0);

    const total_size_human = (total_size / Math.pow(1024, 3)).toPrecision(3) + " GB";
    // god....
    document.getElementsByClassName("directory-listing-table")[0].childNodes[1].childNodes[1].childNodes[4].innerHTML = total_size_human;
    // do this better please.

  }
})();