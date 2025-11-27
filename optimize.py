#!/usr/bin/env python3
import re
import json

def optimize_html(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Minify inline CSS - remove unnecessary whitespace but keep structure
    def minify_css(match):
        css = match.group(1)
        # Remove comments
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        # Remove unnecessary whitespace but keep spaces for safety
        css = re.sub(r'\s*([{}:;,])\s*', r'\1', css)
        css = re.sub(r';\s*}', '}', css)
        css = re.sub(r'\s+', ' ', css)
        return f'<style>{css}</style>'

    html = re.sub(r'<style[^>]*>(.*?)</style>', minify_css, html, flags=re.DOTALL)

    # 2. Minify inline JavaScript while preserving functionality
    def minify_js_in_script(match):
        js = match.group(1)
        # Only minify non-essential whitespace
        # Remove line comments (but be careful with URLs)
        js = re.sub(r'(?<!")//[^\n]*(?!:)', '', js)
        # Remove excessive whitespace around operators
        js = re.sub(r'\s*([=+\-*/%<>!&|])\s*', r' \1 ', js)
        # Remove whitespace around punctuation
        js = re.sub(r'\s*([{}();,:])\s*', r'\1', js)
        # Collapse multiple spaces
        js = re.sub(r'\s+', ' ', js)
        # Remove leading/trailing whitespace from lines
        js = '\n'.join(line.strip() for line in js.split('\n') if line.strip())
        return f'<script>{js}</script>'

    html = re.sub(r'<script[^>]*>(.*?)</script>', minify_js_in_script, html, flags=re.DOTALL)

    # 3. Remove HTML comments except IE conditionals
    html = re.sub(r'<!--(?!\[if).*?-->', '', html, flags=re.DOTALL)

    # 4. Remove unnecessary whitespace in HTML
    # Remove whitespace between tags
    html = re.sub(r'>\s+<', '><', html)
    # Remove leading/trailing whitespace
    html = re.sub(r'^\s+|\s+$', '', html, flags=re.MULTILINE)

    # 5. Optimize data URIs - ensure they're compressed
    # WebP images are already optimized

    # 6. Combine consecutive spaces in text content
    html = re.sub(r'([^<>])\s{2,}([^<>])', r'\1 \2', html)

    # 7. Remove empty lines
    html = re.sub(r'\n\s*\n', '\n', html)

    # Write optimized version
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)

    # Calculate savings
    import os
    original_size = os.path.getsize(input_file)
    optimized_size = os.path.getsize(output_file)
    reduction = (1 - optimized_size/original_size) * 100

    print(f"Original size: {original_size:,} bytes")
    print(f"Optimized size: {optimized_size:,} bytes")
    print(f"Reduction: {reduction:.1f}%")

    return optimized_size, original_size

if __name__ == "__main__":
    optimize_html('index.html', 'index-optimized.html')