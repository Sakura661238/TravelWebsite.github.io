using System.Collections.Generic;

namespace Assignment2_TravelWebsite.Models
{
    // Attraction model: corresponds to a single attraction in destinations.json
    public class Destination
    {
        public int Id { get; set; }          // Attraction ID
        public string Name { get; set; }     // Attraction name
        public string Region { get; set; }   // Region (e.g., "Beijing, China")
        public List<string> Type { get; set; } // Type (e.g., ["Historical and Cultural"])
        public double Rating { get; set; }   // Rating
        public List<string> Keywords { get; set; } // Keywords
        public string Description { get; set; } // Description
        public string Address { get; set; }  // Address
        public string MainImage { get; set; } // Main image path for detail page
        public List<string> SubImages { get; set; } // Sub-images path for detail page
        public string ListImage { get; set; } // Image path for list page
    }
}