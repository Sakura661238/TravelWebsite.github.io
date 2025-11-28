using Assignment2_TravelWebsite.Models;
using System.Linq;
using System.Web.Mvc;

namespace Assignment2_TravelWebsite.Controllers
{
    public class HomeController : Controller
    {
        // Home page: corresponds to Views/Home/Index.cshtml
        public ActionResult Index()
        {
            // 1. Retrieve data via Model
            var context = new DestinationContext();
            var allDestinations = context.GetAllDestinations();
            var allRegions = context.GetAllRegions();

            // 2. Filter recommended attractions for homepage (rating ≥4.6, take top 6)
            var recommendedDests = allDestinations
                .Where(d => d.Rating >= 4.6)
                .OrderByDescending(d => d.Rating)
                .Take(6)
                .ToList();

            // 3. Filter regions for homepage (take top 8)
            var normalizedRegions = allRegions
               .Select((region, index) => new Region
               {
                   Id = index + 1, // Force Id to start from 1 and increment (corresponds to region1.jpg, region2.jpg)
                   Name = region.Name,
                   ImagePath = $"region{index + 1}.jpg"
               })
               .ToList();
            var displayRegions = normalizedRegions.Take(8).ToList();

            // 4. Pass data to view (ViewBag is a temporary data container for MVC)
            ViewBag.RecommendedDests = recommendedDests;
            ViewBag.DisplayRegions = displayRegions;

            // 5. Return home page view
            return View();
        }
        // Add About Action
        public ActionResult About()
        {
            ViewBag.Message = "About Us page";
            return View();
        }

        // Add Contact Action
        public ActionResult Contact()
        {
            ViewBag.Message = "Contact Us page";
            return View();
        }
    }
}