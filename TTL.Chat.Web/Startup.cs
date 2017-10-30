using System;
using System.Threading.Tasks;
using Microsoft.Owin;
using Owin;
using System.Web.Http;

[assembly: OwinStartup(typeof(TTL.Chat.Web.Startup))]

namespace TTL.Chat.Web
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            //app.UseStaticFiles();
            ConfigureSignalR(app);
            ConfigureWebApi(app);
        }

        private void ConfigureSignalR(IAppBuilder app)
        {
            app.MapSignalR();
        }

        private void ConfigureWebApi(IAppBuilder app)
        {
            var apiConfiguration = new HttpConfiguration();
            apiConfiguration.Routes.MapHttpRoute
                (
                    name: "DefaultApi",
                    routeTemplate: "{controller}"
                );
            apiConfiguration.MapHttpAttributeRoutes();
            apiConfiguration.IncludeErrorDetailPolicy = IncludeErrorDetailPolicy.Always;

            app.UseWebApi(apiConfiguration);
            //app.UseNinjectMiddleware(() => NinjectContaner.Instance).UseNinjectWebApi(apiConfiguration);
        }
    }
}
