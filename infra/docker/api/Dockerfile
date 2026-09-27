# Catch The Flag — API runtime image
# PHP 8.4 CLI with the extensions Laravel + PostgreSQL require.
# Used by docker-compose for local development AND as the base for
# composer operations (create-project / install).
FROM php:8.4-cli-bookworm

# System deps: git/unzip for composer, lib* for extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip curl ca-certificates \
        libpq-dev libzip-dev libonig-dev libcurl4-openssl-dev \
        libxml2-dev libicu-dev \
    && rm -rf /var/lib/apt/lists/*

# Extensions required/used by Laravel + pgsql (see docs/development.md §1)
RUN docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql pgsql \
        mbstring \
        zip \
        bcmath \
        intl \
        opcache \
    && pecl install redis > /dev/null 2>&1 && docker-php-ext-enable redis

# Composer (official installer)
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

# Match host UID so bind-mounted files stay owned by the developer
ARG UID=1000
ARG GID=1000
RUN groupadd -g ${GID} appuser && useradd -m -u ${UID} -g ${GID} appuser \
    && mkdir -p /app && chown appuser:appuser /app

WORKDIR /app
USER appuser

EXPOSE 8000
CMD ["php", "-v"]
