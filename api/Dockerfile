FROM php:8.3-apache

# Si tu API usa MySQL/MariaDB, descomenta la siguiente línea:
# RUN docker-php-ext-install pdo_mysql mysqli

RUN a2enmod rewrite headers \
 && sed -ri '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
 && printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-enabled/hardening.conf \
 && echo 'expose_php=Off' > /usr/local/etc/php/conf.d/app.ini \
 && echo ok > /var/www/html/health.txt \
 && mkdir -p /var/www/data && chown www-data:www-data /var/www/data

# El backend (carpeta app/) se publica en la ruta /api del dominio.
# Si tu JavaScript usa otra ruta (por ejemplo /app/), cambia /api por esa ruta aqui
# y en frontend/nginx.conf (location /api/).
COPY . /var/www/html/api
VOLUME /var/www/data
