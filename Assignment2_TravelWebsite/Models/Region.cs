using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assignment2_TravelWebsite.Models
{ // Region model: corresponds to regions in destinations.json
    public class Region
    {
        public int Id { get; set; }          // Region ID
        public string Name { get; set; }     // Region name (e.g., "Beijing, China")
        public string Intro { get; set; }    // Region introduction
        public string ImagePath { get; set; }
    }
}