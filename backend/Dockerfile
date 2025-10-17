FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    nodejs \
    npm \
    default-mysql-client \
    nginx \
    supervisor

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set working directory
WORKDIR /var/www

# Copy backend code
COPY . /var/www

# Copy permissions
RUN chown -R www-data:www-data /var/www

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY .env /var/www
# Generate Laravel key if not exists
RUN if [ ! -f .env ]; then cp .env.example .env; fi

RUN php artisan key:generate || true

# Create storage directories
RUN mkdir -p /var/www/storage/app/public/frontend \
    && mkdir -p /var/www/storage/framework/cache \
    && mkdir -p /var/www/storage/framework/sessions \
    && mkdir -p /var/www/storage/framework/views \
    && mkdir -p /var/www/storage/logs \
    && mkdir -p /var/www/bootstrap/cache \
    && chown -R www-data:www-data /var/www/storage \
    && chown -R www-data:www-data /var/www/bootstrap/cache \
    && chmod -R 775 /var/www/storage \
    && chmod -R 775 /var/www/bootstrap/cache

# Configure Nginx
RUN mkdir -p /etc/nginx/sites-enabled
COPY <<EOF /etc/nginx/sites-enabled/default
server {
    listen 8000;
    server_name _;
    root /var/www/public;
    index index.php;

    # Increase client body size for file uploads
    client_max_body_size 100M;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php\$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    # Deny access to .htaccess files
    location ~ /\.ht {
        deny all;
    }
}
EOF

# Configure Supervisor to manage Nginx, PHP-FPM, and Reverb
COPY <<EOF /etc/supervisor/conf.d/supervisord.conf
[supervisord]
nodaemon=true
logfile=/var/log/supervisord.log

[program:php-fpm]
command=/usr/local/sbin/php-fpm
autostart=true
autorestart=true
priority=999
stdout_logfile=/var/log/php-fpm.log
stderr_logfile=/var/log/php-fpm-error.log

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
priority=998
stdout_logfile=/var/log/nginx.log
stderr_logfile=/var/log/nginx-error.log

[program:reverb]
command=/usr/local/bin/php /var/www/artisan reverb:start --host=0.0.0.0 --port=8080
user=www-data
autostart=true
autorestart=true
priority=997
stdout_logfile=/var/log/reverb.log
stderr_logfile=/var/log/reverb-error.log
EOF

# Expose ports 8000 (Laravel) and 8080 (Reverb)
EXPOSE 8000 8080