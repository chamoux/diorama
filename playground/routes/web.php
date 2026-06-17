<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Home'));
Route::get('/about', fn () => Inertia::render('About'));
Route::get('/work/{slug}', fn (string $slug) => Inertia::render('Work/Show', ['slug' => $slug]));
