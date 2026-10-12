<?php

declare(strict_types=1);

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Suspended account attempting authenticated access.
 * Rendered as {code: account_banned} by the API exception handler.
 */
class AccountBannedException extends HttpException
{
    public function __construct()
    {
        parent::__construct(403, 'This account has been suspended.');
    }
}
