#include <metal_stdlib>
#include "metal"
using namespace metal;

struct A {
    float a;
};

// A comment
A N11(float *v) { // commet
    return fract(sin(v) * 43758.5453123);
}
