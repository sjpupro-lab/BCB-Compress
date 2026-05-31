# Consumer-side CMake example — links against the PREBUILT libbcb from Releases.
# This does NOT build BCB from source (no source is published).
#
#   cmake -S . -B build -DBCB_ROOT=/path/to/extracted/bcb-bundle
#   cmake --build build
#   ./build/quickstart /path/to/your.bcb-prior

cmake_minimum_required(VERSION 3.15)
project(bcb_quickstart C)

set(CMAKE_C_STANDARD 99)

# Point BCB_ROOT at the extracted Releases bundle (contains include/ and lib/).
set(BCB_ROOT "" CACHE PATH "Path to the extracted prebuilt BCB bundle")
if(NOT BCB_ROOT)
  message(FATAL_ERROR "Set -DBCB_ROOT=/path/to/bcb-bundle (from GitHub Releases)")
endif()

add_executable(quickstart quickstart.c)
target_include_directories(quickstart PRIVATE "${BCB_ROOT}/include")
find_library(BCB_LIB NAMES bcb libbcb PATHS "${BCB_ROOT}/lib" REQUIRED)
target_link_libraries(quickstart PRIVATE "${BCB_LIB}")

# Alternatively, if the bundle ships a CMake package config:
#   find_package(bcb REQUIRED)
#   target_link_libraries(quickstart PRIVATE bcb::bcb)
