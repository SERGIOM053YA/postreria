FROM php:8.3-apache

RUN a2enmod rewrite headers \
    && printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-enabled/hardening.conf \
    && echo 'expose_php=Off' > /usr/local/etc/php/conf.d/app.ini \
    && mkdir -p /var/www/data && chown www-data:www-data /var/www/data

COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

VOLUME /var/www/data
EXPOSE 80