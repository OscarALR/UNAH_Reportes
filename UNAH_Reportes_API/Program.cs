using Microsoft.Identity.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using UNAH_Reportes_API.Data;
using UNAH_Reportes_API.Services;
using Microsoft.AspNetCore.Authorization;
using UNAH_Reportes_API.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "UNAH_Reportes_API", Version = "v1" });

    options.AddSecurityDefinition("oauth2", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.OAuth2,
        Flows = new Microsoft.OpenApi.Models.OpenApiOAuthFlows
        {
            AuthorizationCode = new Microsoft.OpenApi.Models.OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/oauth2/v2.0/authorize"),
                TokenUrl = new Uri($"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/oauth2/v2.0/token"),
                Scopes = new Dictionary<string, string>
                {
                    { $"api://{builder.Configuration["AzureAd:ClientId"]}/access_as_user", "Acceso a la API como usuario" }
                }
            }
        }
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "oauth2"
                }
            },
            new[] { $"api://{builder.Configuration["AzureAd:ClientId"]}/access_as_user" }
        }
    });
});


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<BlobStorageService>();
builder.Services.AddScoped<LocalTokenService>();
builder.Services.AddScoped<IPasswordHasher<UNAH_Reportes_API.Models.Usuario>, PasswordHasher<UNAH_Reportes_API.Models.Usuario>>();
builder.Services.AddScoped<DemoUserSeeder>();

var localJwt = builder.Configuration.GetSection("LocalJwt");
var localSigningKey = localJwt["SigningKey"] ?? throw new InvalidOperationException("Configura LocalJwt:SigningKey mediante secretos de usuario.");
var authenticationBuilder = builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "SelectorAutenticacion";
        options.DefaultChallengeScheme = "SelectorAutenticacion";
    })
    .AddPolicyScheme("SelectorAutenticacion", "Selecciona Microsoft o autenticación local", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var encabezado = context.Request.Headers.Authorization.ToString();
            if (!encabezado.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) return JwtBearerDefaults.AuthenticationScheme;
            try
            {
                var token = new JwtSecurityTokenHandler().ReadJwtToken(encabezado[7..]);
                return token.Issuer == localJwt["Issuer"] ? "LocalBearer" : JwtBearerDefaults.AuthenticationScheme;
            }
            catch { return JwtBearerDefaults.AuthenticationScheme; }
        };
    });

authenticationBuilder.AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"), JwtBearerDefaults.AuthenticationScheme);
authenticationBuilder.AddJwtBearer("LocalBearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidIssuer = localJwt["Issuer"],
            ValidateAudience = true, ValidAudience = localJwt["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(localSigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddScoped<IAuthorizationHandler, AdministradorAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, UsuarioActivoAuthorizationHandler>();

builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .AddAuthenticationSchemes("SelectorAutenticacion")
        .RequireAuthenticatedUser()
        .AddRequirements(new UsuarioActivoRequirement())
        .Build();

    options.AddPolicy("SoloAdministrador", policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.AddRequirements(new UsuarioActivoRequirement());
        policy.AddRequirements(new AdministradorRequirement());
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<DemoUserSeeder>().CrearSiCorrespondeAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.OAuthClientId(builder.Configuration["AzureAd:ClientId"]);
        options.OAuthUsePkce();
    });
}

app.UseCors("PermitirFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
