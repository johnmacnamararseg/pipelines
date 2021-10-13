# Copyright 2021 The Kubeflow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Launcher module for dataflow componeonts."""

import argparse
import os
import sys
from typing import Dict, Any, Tuple, List
from . import dataflow_python_job_remote_runner


def _make_parent_dirs_and_return_path(file_path: str):
  os.makedirs(os.path.dirname(file_path), exist_ok=True)
  return file_path


def _parse_args(args) -> Tuple[Dict[str, Any], List[str]]:
  """Parse command line arguments.

  Args:
    args: A list of arguments.

  Returns:
    A tuple containing an argparse.Namespace class instance holding parsed args,
    and a list containing all unknonw args.
  """
  parser = argparse.ArgumentParser(
      prog='Dataflow python job Pipelines service launcher', description='')
  parser.add_argument(
      '--project',
      dest='project',
      type=str,
      required=True,
      default=argparse.SUPPRESS)
  parser.add_argument(
      '--location',
      dest='location',
      type=str,
      required=True,
      default=argparse.SUPPRESS)
  parser.add_argument(
      '--python_module_path',
      dest='The gcs path to the python file or folder to run.',
      type=str,
      required=True,
      default=argparse.SUPPRESS)
  parser.add_argument(
      '--temp_location',
      dest='A GCS path for Dataflow to stage temporary job files created during the execution of the pipeline.',
      type=str,
      required=True,
      default=argparse.SUPPRESS)
  parser.add_argument(
      '--requirements_file_path',
      dest='The gcs or local path to the requirements file.',
      type=str,
      required=False,
      default=argparse.SUPPRESS)
  parser.add_argument(
      '--args',
      dest='The list of args to pass to the python file.',
      type=str,
      required=True,
      default=argparse.SUPPRESS)
  parser.add_argument(
      '--gcp_resources',
      dest='A placeholder output for returning the gcp_resouces proto.',
      type=_make_parent_dirs_and_return_path,
      required=True,
      default=argparse.SUPPRESS)
  parsed_args, _ = parser.parse_known_args(args)
  parsed_args, unknownargs = parser.parse_known_args(args)
  return (vars(parsed_args), unknownargs)


def main(argv):
  """Main entry for Dataflow python job launcher.

  expected input args are as follows:
  Project - Required. The project of which the resource will be launched.
  Region - Required. The region of which the resource will be launched.
  python_module_path - The gcs path to the python file or folder to run.
  temp_location - A GCS path for Dataflow to stage temporary job files created
  during the execution of the pipeline.
  requirements_file_path - The gcs or local path to the requirements file.
  args - The list of args to pass to the python file.
  **Kwargs - all other arguments passed in will be directly used as input to
  beam runner.
  gcp_resources - A placeholder output for returning the gcp_resouces proto.

  Args:
    argv: A list of system arguments.
  """

  parsed_args, unknownargs = _parse_args(argv)
  dataflow_python_job_remote_runner.create_python_job(
      unknownargs,
      **parsed_args,
  )


if __name__ == '__main__':
  main(sys.argv[1:])
