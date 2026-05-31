/* BCB quickstart — links against the prebuilt libbcb from Releases.
 *
 *   cc quickstart.c -I<bcb>/include -L<bcb>/lib -lbcb -o quickstart
 *   ./quickstart your.bcb-prior
 *
 * Build a prior first with the bundled CLI:
 *   bcb-prior-build sample.bin your.bcb-prior --schema-record-size <N>
 */
#include "bcb.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "usage: %s <prior.bcb-prior>\n", argv[0]);
        return 2;
    }
    printf("BCB version: %s\n", bcb_version());

    BcbPrior *p = bcb_prior_open(argv[1]);
    if (!p) { fprintf(stderr, "failed to open prior: %s\n", argv[1]); return 1; }

    /* Replace with one of your real messages. */
    const uint8_t msg[] = "example small message / packet payload";
    size_t msg_len = sizeof(msg) - 1;

    size_t cap = bcb_compress_bound(msg_len);
    uint8_t *out  = malloc(cap);
    uint8_t *back = malloc(msg_len);
    if (!out || !back) { fprintf(stderr, "oom\n"); return 1; }

    ssize_t n = bcb_compress(p, msg, msg_len, out, cap);
    if (n < 0) { fprintf(stderr, "compress: %s\n", bcb_strerror((BcbStatus)n)); return 1; }

    ssize_t m = bcb_decompress(p, out, (size_t)n, back, msg_len);
    if (m < 0) { fprintf(stderr, "decompress: %s\n", bcb_strerror((BcbStatus)m)); return 1; }

    int lossless = (m == (ssize_t)msg_len) && (memcmp(msg, back, msg_len) == 0);
    printf("original : %zu bytes\n", msg_len);
    printf("compressed: %zd bytes (%.2fx)\n", n, (double)msg_len / (double)n);
    printf("lossless : %s\n", lossless ? "yes" : "NO");

    free(out); free(back);
    bcb_prior_close(p);
    return lossless ? 0 : 1;
}
