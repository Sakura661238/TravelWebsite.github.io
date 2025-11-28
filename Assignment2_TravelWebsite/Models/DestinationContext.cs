using Assignment2_TravelWebsite.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Web;

namespace Assignment2_TravelWebsite.Models
{
    // Data context: responsible for loading JSON data and providing it to controllers
    public class DestinationContext
    {
        // Read all attractions data
        public List<Destination> GetAllDestinations()
        {
            // Get JSON file path (App_Data/destinations.json)
            string jsonPath = Path.Combine(HttpContext.Current.Server.MapPath("~/App_Data"), "destinations.json");
            // Read JSON content
            string jsonContent = File.ReadAllText(jsonPath);
            // Parse JSON into an object containing Destinations and Regions (matching the JSON structure)
            var jsonData = JsonConvert.DeserializeObject<dynamic>(jsonContent);
            // Convert to List<Destination> and return
            return JsonConvert.DeserializeObject<List<Destination>>(jsonData.destinations.ToString());
        }

        // Read all regions data
        public List<Region> GetAllRegions()
        {
            string jsonPath = Path.Combine(HttpContext.Current.Server.MapPath("~/App_Data"), "destinations.json");
            string jsonContent = File.ReadAllText(jsonPath);
            var jsonData = JsonConvert.DeserializeObject<dynamic>(jsonContent);
            return JsonConvert.DeserializeObject<List<Region>>(jsonData.regions.ToString());
        }

        // Get a single attraction by ID (for detail page)
        public Destination GetDestinationById(int id)
        {
            var allDests = GetAllDestinations();
            return allDests.Find(d => d.Id == id);
        }
    }
}