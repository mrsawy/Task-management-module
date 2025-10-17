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

# Copy .env first
COPY .env /var/www
RUN if [ ! -f .env ]; then cp .env.example .env; fi

# Copy permissions
RUN chown -R www-data:www-data /var/www

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

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

# Configure Nginx using echo commands
RUN mkdir -p /etc/nginx/sites-enabled && \
    echo 'server {' > /etc/nginx/sites-enabled/default && \
    echo '    listen 8000;' >> /etc/nginx/sites-enabled/default && \
    echo '    server_name _;' >> /etc/nginx/sites-enabled/default && \
    echo '    root /var/www/public;' >> /etc/nginx/sites-enabled/default && \
    echo '    index index.php;' >> /etc/nginx/sites-enabled/default && \
    echo '    client_max_body_size 100M;' >> /etc/nginx/sites-enabled/default && \
    echo '    location / {' >> /etc/nginx/sites-enabled/default && \
    echo '        try_files $uri $uri/ /index.php?$query_string;' >> /etc/nginx/sites-enabled/default && \
    echo '    }' >> /etc/nginx/sites-enabled/default && \
    echo '    location ~ \.php$ {' >> /etc/nginx/sites-enabled/default && \
    echo '        fastcgi_pass 127.0.0.1:9000;' >> /etc/nginx/sites-enabled/default && \
    echo '        fastcgi_index index.php;' >> /etc/nginx/sites-enabled/default && \
    echo '        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;' >> /etc/nginx/sites-enabled/default && \
    echo '        include fastcgi_params;' >> /etc/nginx/sites-enabled/default && \
    echo '    }' >> /etc/nginx/sites-enabled/default && \
    echo '    location ~ /\.ht {' >> /etc/nginx/sites-enabled/default && \
    echo '        deny all;' >> /etc/nginx/sites-enabled/default && \
    echo '    }' >> /etc/nginx/sites-enabled/default && \
    echo '}' >> /etc/nginx/sites-enabled/default

# Configure Supervisor
RUN mkdir -p /etc/supervisor/conf.d && \
    echo '[supervisord]' > /etc/supervisor/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/supervisord.conf && \
    echo 'logfile=/var/log/supervisord.log' >> /etc/supervisor/supervisord.conf && \
    echo '[program:php-fpm]' >> /etc/supervisor/supervisord.conf && \
    echo 'command=/usr/local/sbin/php-fpm' >> /etc/supervisor/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/supervisord.conf && \
    echo 'priority=999' >> /etc/supervisor/supervisord.conf && \
    echo 'stdout_logfile=/var/log/php-fpm.log' >> /etc/supervisor/supervisord.conf && \
    echo 'stderr_logfile=/var/log/php-fpm-error.log' >> /etc/supervisor/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisor/supervisord.conf && \
    echo 'command=/usr/sbin/nginx -g "daemon off;"' >> /etc/supervisor/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/supervisord.conf && \
    echo 'priority=998' >> /etc/supervisor/supervisord.conf && \
    echo 'stdout_logfile=/var/log/nginx.log' >> /etc/supervisor/supervisord.conf && \
    echo 'stderr_logfile=/var/log/nginx-error.log' >> /etc/supervisor/supervisord.conf && \
    echo '[program:reverb]' >> /etc/supervisor/supervisord.conf && \
    echo 'command=/usr/local/bin/php /var/www/artisan reverb:start --host=0.0.0.0 --port=8080 || true' >> /etc/supervisor/supervisord.conf && \
    echo 'user=www-data' >> /etc/supervisor/supervisord.conf && \
    echo 'autostart=false' >> /etc/supervisor/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/supervisord.conf && \
    echo 'priority=997' >> /etc/supervisor/supervisord.conf && \
    echo 'stdout_logfile=/var/log/reverb.log' >> /etc/supervisor/supervisord.conf && \
    echo 'stderr_logfile=/var/log/reverb-error.log' >> /etc/supervisor/supervisord.conf

EXPOSE 8000 8080